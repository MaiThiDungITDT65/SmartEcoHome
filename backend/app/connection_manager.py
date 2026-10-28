import logging
from typing import Any, Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("smart_eco_garden.connection_manager")


class ConnectionManager:
    """
    Manages active WebSocket connections to Next.js clients and dashboards.
    Safely broadcasts state snapshots and removes dropped connections.
    """

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    @property
    def active_count(self) -> int:
        return len(self.active_connections)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.warning(f"Error sending message to client: {e}. Removing connection.")
            self.disconnect(websocket)
            return False

    async def broadcast(self, message: Dict[str, Any]) -> None:
        if not self.active_connections:
            return

        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}. Scheduling removal.")
                dead_connections.append(connection)

        for dead_conn in dead_connections:
            self.disconnect(dead_conn)
