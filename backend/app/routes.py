import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, WebSocket, WebSocketDisconnect

from app.config import Settings, get_settings
from app.connection_manager import ConnectionManager
from app.schemas import StatusResponse, TelemetryPayload, TelemetryResponse
from app.state_manager import StateManager

logger = logging.getLogger("smart_eco_garden.routes")

settings = get_settings()
state_manager = StateManager(timeout_seconds=settings.TELEMETRY_TIMEOUT_SECONDS)
connection_manager = ConnectionManager()

router = APIRouter()


def verify_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    app_settings: Settings = Depends(get_settings),
) -> None:
    """Verifies API key header if TELEMETRY_API_KEY is configured."""
    if app_settings.TELEMETRY_API_KEY:
        if not x_api_key or x_api_key != app_settings.TELEMETRY_API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")


@router.get("/api/health")
def health_check():
    """Simple service health check (backend uptime, not device connection)."""
    return {
        "status": "ok",
        "service": "Smart Eco Garden Backend",
        "version": "1.0",
    }


@router.get("/api/status", response_model=StatusResponse)
def get_current_status():
    """
    Returns latest in-memory state, server-derived connection status,
    and last-seen timestamp. Works before first telemetry arrives.
    """
    return state_manager.get_status_response()


@router.post("/api/telemetry", response_model=TelemetryResponse)
async def ingest_telemetry(
    payload: TelemetryPayload,
    _: None = Depends(verify_api_key),
):
    """
    Receives complete or partial telemetry from ESP32, updates in-memory state,
    and broadcasts the updated state to connected WebSocket clients.
    """
    received_at = state_manager.update_telemetry(payload)
    current_status = state_manager.get_status_response()

    # Broadcast updated state to all connected dashboard clients
    await connection_manager.broadcast({
        "event": "update",
        **current_status.model_dump(),
    })

    return TelemetryResponse(
        status="success",
        received_at=received_at,
        connected=True,
    )


@router.websocket("/ws/status")
async def websocket_status_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.
    Sends current state snapshot upon connection, then listens for disconnects.
    """
    await connection_manager.connect(websocket)
    try:
        # Send initial snapshot immediately upon connect
        snapshot = state_manager.get_status_response()
        await websocket.send_json({
            "event": "snapshot",
            **snapshot.model_dump(),
        })

        # Keep connection open and await any client ping/pong or disconnect
        while True:
            # We only expect client pings or heartbeats; discard payload
            await websocket.receive_text()
    except (WebSocketDisconnect, RuntimeError):
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
    finally:
        connection_manager.disconnect(websocket)
