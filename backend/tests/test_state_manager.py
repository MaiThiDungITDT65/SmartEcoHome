from datetime import datetime, timezone, timedelta
import pytest
from app.state_manager import StateManager
from app.schemas import TelemetryPayload


class MockClock:
    def __init__(self, start_time: datetime):
        self.current_time = start_time

    def advance(self, seconds: float):
        self.current_time += timedelta(seconds=seconds)

    def now(self) -> datetime:
        return self.current_time


@pytest.fixture
def mock_clock():
    start = datetime(2026, 10, 27, 12, 0, 0, tzinfo=timezone.utc)
    return MockClock(start)


@pytest.fixture
def state_mgr(mock_clock):
    return StateManager(timeout_seconds=30.0, clock_fn=mock_clock.now)


def test_initial_state_before_telemetry(state_mgr):
    # Requirement: GET /api/status works before any telemetry exists
    # Initial device state must be unknown until actual telemetry is received
    status = state_mgr.get_status_response()
    assert status.online is False
    assert status.has_telemetry is False
    assert status.last_seen is None
    assert status.state is None
    assert state_mgr.is_online() is False


def test_first_telemetry_arrival(state_mgr, mock_clock):
    payload = TelemetryPayload.model_validate({
        "greenhouse": {
            "temperature": 25.5,
            "humidity": 60.0
        }
    })
    received_at = state_mgr.update_telemetry(payload)
    assert received_at == "2026-10-27T12:00:00+00:00"

    status = state_mgr.get_status_response()
    assert status.online is True
    assert status.has_telemetry is True
    assert status.last_seen == "2026-10-27T12:00:00+00:00"
    assert status.state is not None
    assert status.state["greenhouse"]["temperature"] == 25.5
    assert status.state["greenhouse"]["humidity"] == 60.0
    # Canonical structure defaults preserved for non-updated fields
    assert status.state["smart_door"]["status"] == "closed"
    assert status.state["system"]["last_update"] == "2026-10-27T12:00:00+00:00"
    assert status.state["system"]["status"] == "online"


def test_partial_update_preserves_omitted_values(state_mgr, mock_clock):
    # Requirement 7: Partial updates preserve omitted existing values
    payload1 = TelemetryPayload.model_validate({
        "greenhouse": {
            "temperature": 25.0,
            "humidity": 70.0
        }
    })
    state_mgr.update_telemetry(payload1)

    mock_clock.advance(5)
    # Update only temperature, omit humidity
    payload2 = TelemetryPayload.model_validate({
        "greenhouse": {
            "temperature": 26.5
        }
    })
    state_mgr.update_telemetry(payload2)

    status = state_mgr.get_status_response()
    assert status.state["greenhouse"]["temperature"] == 26.5
    assert status.state["greenhouse"]["humidity"] == 70.0  # Preserved!
    assert status.last_seen == "2026-10-27T12:00:05+00:00"


def test_explicit_null_marks_reading_unavailable(state_mgr, mock_clock):
    # Requirement 8: Explicit null marks a reading as unavailable
    payload1 = TelemetryPayload.model_validate({
        "greenhouse": {
            "temperature": 25.0,
            "humidity": 70.0
        }
    })
    state_mgr.update_telemetry(payload1)

    payload2 = TelemetryPayload.model_validate({
        "greenhouse": {
            "temperature": None  # Sensor reading failed / unavailable
        }
    })
    state_mgr.update_telemetry(payload2)

    status = state_mgr.get_status_response()
    assert status.state["greenhouse"]["temperature"] is None  # Marked unavailable!
    assert status.state["greenhouse"]["humidity"] == 70.0    # Omitted field still preserved!


def test_timeout_and_offline_transition(state_mgr, mock_clock):
    # Requirement 12: Device becomes offline after configured timeout
    # Requirement 13: Deterministic timeout testing without sleeps
    assert state_mgr.check_timeout_transition() is False  # Never was online

    payload = TelemetryPayload.model_validate({
        "greenhouse": {"temperature": 24.0}
    })
    state_mgr.update_telemetry(payload)
    assert state_mgr.is_online() is True
    assert state_mgr.check_timeout_transition() is False  # Online, no offline transition

    # Advance clock to 29 seconds (still within 30s timeout)
    mock_clock.advance(29.0)
    assert state_mgr.is_online() is True
    assert state_mgr.check_timeout_transition() is False

    # Advance clock 2 more seconds (total 31s > 30s timeout)
    mock_clock.advance(2.0)
    assert state_mgr.is_online() is False

    # Edge transition: first check should return True (offline transition detected)
    assert state_mgr.check_timeout_transition() is True

    # Subsequent check should return False (already offline, no spam)
    assert state_mgr.check_timeout_transition() is False

    # State system.status should reflect offline
    status = state_mgr.get_status_response()
    assert status.online is False
    assert status.state["system"]["status"] == "offline"
