import pytest
from unittest.mock import AsyncMock
from app.connection_manager import ConnectionManager


@pytest.mark.anyio
async def test_connection_manager_connect_and_disconnect():
    manager = ConnectionManager()
    mock_ws = AsyncMock()

    await manager.connect(mock_ws)
    mock_ws.accept.assert_awaited_once()
    assert manager.active_count == 1

    manager.disconnect(mock_ws)
    assert manager.active_count == 0


@pytest.mark.anyio
async def test_connection_manager_broadcast():
    manager = ConnectionManager()
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()

    await manager.connect(mock_ws1)
    await manager.connect(mock_ws2)
    assert manager.active_count == 2

    message = {"event": "update", "data": "test"}
    await manager.broadcast(message)

    mock_ws1.send_json.assert_awaited_once_with(message)
    mock_ws2.send_json.assert_awaited_once_with(message)


@pytest.mark.anyio
async def test_connection_manager_handles_dead_connections():
    manager = ConnectionManager()
    mock_ws_healthy = AsyncMock()
    mock_ws_dead = AsyncMock()
    mock_ws_dead.send_json.side_effect = RuntimeError("Connection closed")

    await manager.connect(mock_ws_healthy)
    await manager.connect(mock_ws_dead)
    assert manager.active_count == 2

    message = {"event": "status_change", "online": False}
    # Should not raise exception even if dead connection throws
    await manager.broadcast(message)

    # Dead connection should be removed from active connections
    assert manager.active_count == 1
    mock_ws_healthy.send_json.assert_awaited_once_with(message)
