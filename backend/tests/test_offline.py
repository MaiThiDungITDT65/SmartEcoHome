from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.routes import connection_manager, state_manager
from app.schemas import TelemetryPayload


class ControllableClock:
    def __init__(self, initial_time: datetime):
        self.time = initial_time

    def now(self) -> datetime:
        return self.time

    def advance(self, seconds: float):
        self.time += timedelta(seconds=seconds)


def test_device_offline_before_telemetry():
    # Requirement 13: The device remains offline before any telemetry has ever arrived.
    clock = ControllableClock(datetime(2026, 10, 27, 10, 0, 0, tzinfo=timezone.utc))
    state_manager.reset()
    state_manager.clock_fn = clock.now

    client = TestClient(app)
    resp = client.get("/api/status")
    data = resp.json()
    assert data["online"] is False
    assert data["has_telemetry"] is False
    assert data["last_seen"] is None
    assert data["state"] is None


def test_device_becomes_offline_after_timeout():
    # Requirement 12: The device becomes offline after the configured timeout.
    clock = ControllableClock(datetime(2026, 10, 27, 10, 0, 0, tzinfo=timezone.utc))
    state_manager.reset()
    state_manager.clock_fn = clock.now
    state_manager.timeout_seconds = 20.0

    client = TestClient(app)

    # 1. Post telemetry
    client.post("/api/telemetry", json={"greenhouse": {"temperature": 24.5}})
    status_1 = client.get("/api/status").json()
    assert status_1["online"] is True
    assert status_1["state"]["system"]["status"] == "online"

    # 2. Advance clock by 15 seconds (within 20s timeout)
    clock.advance(15.0)
    status_2 = client.get("/api/status").json()
    assert status_2["online"] is True

    # 3. Advance clock by 10 more seconds (total 25s > 20s timeout)
    clock.advance(10.0)
    status_3 = client.get("/api/status").json()
    assert status_3["online"] is False
    assert status_3["state"]["system"]["status"] == "offline"


def test_offline_transition_broadcast_once():
    # Verifies offline transition triggers WebSocket broadcast once
    clock = ControllableClock(datetime(2026, 10, 27, 10, 0, 0, tzinfo=timezone.utc))
    state_manager.reset()
    state_manager.clock_fn = clock.now
    state_manager.timeout_seconds = 10.0

    client = TestClient(app)

    with client.websocket_connect("/ws/status") as ws:
        _ = ws.receive_json()  # Initial snapshot

        # Ingest telemetry
        client.post("/api/telemetry", json={"greenhouse": {"temperature": 25.0}})
        update_msg = ws.receive_json()
        assert update_msg["event"] == "update"
        assert update_msg["online"] is True

        # Advance past timeout
        clock.advance(15.0)

        # Trigger transition check (same as background worker does)
        assert state_manager.check_timeout_transition() is True

        # Second check returns False (no repeated spam)
        assert state_manager.check_timeout_transition() is False
