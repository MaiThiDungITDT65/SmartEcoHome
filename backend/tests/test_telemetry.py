from fastapi.testclient import TestClient
from app.main import app
from app.routes import state_manager
from app.config import get_settings


def test_telemetry_valid_payload():
    state_manager.reset()
    client = TestClient(app)
    payload = {
        "project": {
            "name": "Smart Eco Garden",
            "wifi_ssid": "Lab-WiFi"
        },
        "greenhouse": {
            "temperature": 29.1,
            "humidity": 55.4,
            "soil_moisture_raw": 600,
            "soil_status": "moist",
            "irrigation": {
                "pump": "on",
                "relay": True
            }
        },
        "parking": {
            "distance_cm": 12.5,
            "vehicle_detected": True
        }
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "received_at" in data
    assert data["connected"] is True


def test_telemetry_rejects_prohibited_and_unknown_fields():
    state_manager.reset()
    client = TestClient(app)
    # Prohibited field: water_level_raw
    response = client.post("/api/telemetry", json={
        "greenhouse": {
            "water_level_raw": 150
        }
    })
    assert response.status_code == 422

    # Prohibited field: historical_readings
    response2 = client.post("/api/telemetry", json={
        "historical_readings": [1, 2, 3]
    })
    assert response2.status_code == 422


def test_telemetry_rejects_invalid_types():
    state_manager.reset()
    client = TestClient(app)
    response = client.post("/api/telemetry", json={
        "greenhouse": {
            "temperature": "very_hot"
        }
    })
    assert response.status_code == 422


def test_telemetry_partial_update_preserves_omitted_data():
    state_manager.reset()
    client = TestClient(app)

    # Initial telemetry with temp and humidity
    client.post("/api/telemetry", json={
        "greenhouse": {
            "temperature": 25.0,
            "humidity": 80.0
        }
    })

    # Update only humidity
    client.post("/api/telemetry", json={
        "greenhouse": {
            "humidity": 75.0
        }
    })

    status_resp = client.get("/api/status")
    state = status_resp.json()["state"]
    assert state["greenhouse"]["temperature"] == 25.0
    assert state["greenhouse"]["humidity"] == 75.0


def test_telemetry_explicit_null_marks_unavailable():
    state_manager.reset()
    client = TestClient(app)

    client.post("/api/telemetry", json={
        "greenhouse": {
            "temperature": 25.0,
            "humidity": 80.0
        }
    })

    # Explicit null for temperature
    client.post("/api/telemetry", json={
        "greenhouse": {
            "temperature": None
        }
    })

    status_resp = client.get("/api/status")
    state = status_resp.json()["state"]
    assert state["greenhouse"]["temperature"] is None
    assert state["greenhouse"]["humidity"] == 80.0


def test_telemetry_api_key_auth(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "TELEMETRY_API_KEY", "secret-garden-token")
    client = TestClient(app)

    payload = {"greenhouse": {"temperature": 22.0}}

    # Missing API key -> 401
    resp_missing = client.post("/api/telemetry", json=payload)
    assert resp_missing.status_code == 401
    assert "API key" in resp_missing.json()["detail"]

    # Wrong API key -> 401
    resp_wrong = client.post(
        "/api/telemetry",
        json=payload,
        headers={"X-API-Key": "wrong-token"}
    )
    assert resp_wrong.status_code == 401

    # Correct API key -> 200
    resp_correct = client.post(
        "/api/telemetry",
        json=payload,
        headers={"X-API-Key": "secret-garden-token"}
    )
    assert resp_correct.status_code == 200
