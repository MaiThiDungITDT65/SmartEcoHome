from fastapi.testclient import TestClient
from app.main import app
from app.routes import state_manager


def test_status_before_telemetry():
    state_manager.reset()
    client = TestClient(app)
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["online"] is False
    assert data["has_telemetry"] is False
    assert data["last_seen"] is None
    assert data["state"] is None


def test_status_after_telemetry():
    state_manager.reset()
    client = TestClient(app)
    payload = {
        "greenhouse": {
            "temperature": 27.2,
            "humidity": 62.0
        }
    }
    post_resp = client.post("/api/telemetry", json=payload)
    assert post_resp.status_code == 200

    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["online"] is True
    assert data["has_telemetry"] is True
    assert data["last_seen"] is not None
    assert data["state"]["greenhouse"]["temperature"] == 27.2
    assert data["state"]["greenhouse"]["humidity"] == 62.0
    assert data["state"]["system"]["status"] == "online"
