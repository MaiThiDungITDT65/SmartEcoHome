import pytest
from pydantic import ValidationError
from app.schemas import TelemetryPayload, StatusResponse


def test_valid_telemetry_payload():
    payload_data = {
        "greenhouse": {
            "temperature": 28.5,
            "humidity": 65.0,
            "soil_moisture_raw": 550,
            "soil_status": "moist",
            "irrigation": {
                "pump": "on",
                "relay": True
            }
        },
        "smart_door": {
            "status": "open",
            "servo_angle": 90
        }
    }
    payload = TelemetryPayload.model_validate(payload_data)
    assert payload.greenhouse.temperature == 28.5
    assert payload.greenhouse.irrigation.pump == "on"
    assert payload.smart_door.servo_angle == 90
    assert payload.flood_prevention is None


def test_forbid_prohibited_and_extra_fields():
    # Test 5: Unknown/unimplemented fields such as water level are rejected
    with pytest.raises(ValidationError) as exc_info:
        TelemetryPayload.model_validate({
            "greenhouse": {
                "water_level_raw": 100
            }
        })
    assert "extra_forbidden" in str(exc_info.value) or "extra fields not permitted" in str(exc_info.value)

    with pytest.raises(ValidationError):
        TelemetryPayload.model_validate({
            "water_tank_level": 50
        })


def test_reject_infinite_or_nan_numbers():
    with pytest.raises(ValidationError):
        TelemetryPayload.model_validate({
            "greenhouse": {
                "temperature": float("nan")
            }
        })

    with pytest.raises(ValidationError):
        TelemetryPayload.model_validate({
            "greenhouse": {
                "temperature": float("inf")
            }
        })


def test_reject_invalid_field_types():
    with pytest.raises(ValidationError):
        TelemetryPayload.model_validate({
            "greenhouse": {
                "temperature": "not-a-number"
            }
        })


def test_status_response_schema():
    resp_empty = StatusResponse(
        online=False,
        last_seen=None,
        has_telemetry=False,
        state=None
    )
    assert resp_empty.online is False
    assert resp_empty.has_telemetry is False
    assert resp_empty.state is None
