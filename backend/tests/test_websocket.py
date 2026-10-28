from fastapi.testclient import TestClient
from app.main import app
from app.routes import connection_manager, state_manager


def test_websocket_receives_snapshot_immediately():
    state_manager.reset()
    client = TestClient(app)

    with client.websocket_connect("/ws/status") as websocket:
        data = websocket.receive_json()
        assert data["event"] == "snapshot"
        assert data["online"] is False
        assert data["has_telemetry"] is False
        assert data["last_seen"] is None
        assert data["state"] is None


def test_websocket_receives_telemetry_broadcast():
    state_manager.reset()
    client = TestClient(app)

    with client.websocket_connect("/ws/status") as websocket:
        # Initial snapshot
        snapshot = websocket.receive_json()
        assert snapshot["event"] == "snapshot"

        # Ingest telemetry via HTTP POST
        payload = {
            "greenhouse": {
                "temperature": 26.8,
                "humidity": 68.2
            }
        }
        post_resp = client.post("/api/telemetry", json=payload)
        assert post_resp.status_code == 200

        # WebSocket should receive update broadcast
        broadcast_msg = websocket.receive_json()
        assert broadcast_msg["event"] == "update"
        assert broadcast_msg["online"] is True
        assert broadcast_msg["has_telemetry"] is True
        assert broadcast_msg["state"]["greenhouse"]["temperature"] == 26.8
        assert broadcast_msg["state"]["greenhouse"]["humidity"] == 68.2


def test_websocket_disconnect_cleanup():
    state_manager.reset()
    client = TestClient(app)

    initial_count = connection_manager.active_count

    with client.websocket_connect("/ws/status") as websocket:
        _ = websocket.receive_json()
        assert connection_manager.active_count == initial_count + 1

    # After exiting context manager, client is disconnected
    assert connection_manager.active_count == initial_count
