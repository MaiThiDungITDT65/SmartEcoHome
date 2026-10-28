import copy
import threading
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from app.schemas import StatusResponse, TelemetryPayload

CANONICAL_TEMPLATE: Dict[str, Any] = {
    "project": {
        "name": "Smart Eco Garden",
        "version": "1.0",
        "controller": "ESP32",
        "sensor_controller": "Arduino UNO",
        "connection": "WiFi",
        "wifi_ssid": "SmartEcoGarden",
        "local_ip": "192.168.4.1",
    },
    "system": {
        "status": "online",
        "power_voltage": 5.0,
        "power_unit": "V",
        "last_update": None,
    },
    "greenhouse": {
        "temperature": None,
        "temperature_unit": "C",
        "humidity": None,
        "humidity_unit": "%",
        "soil_moisture_raw": None,
        "soil_status": None,
        "light_raw": None,
        "light_status": None,
        "irrigation": {
            "mode": "auto",
            "pump": "off",
            "relay": False,
            "rain_lock": False,
            "max_run_seconds": 5,
        },
    },
    "smart_door": {
        "status": "closed",
        "servo_angle": None,
        "keypad_enabled": True,
        "password_required": True,
        "auto_close_seconds": 5,
    },
    "parking": {
        "distance_cm": None,
        "vehicle_detected": None,
        "detection_threshold_cm": 15.0,
        "neopixel": {
            "count": 12,
            "status": None,
            "brightness": 5,
        },
    },
    "flood_prevention": {
        "rain_sensor_raw": None,
        "is_raining": None,
        "pump": "off",
        "relay": False,
        "mode": "auto",
        "implementation_status": "pending",
    },
    "security": {
        "vibration_detected": False,
        "alarm": False,
    },
}


def deep_merge(base: Dict[str, Any], update: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively merges `update` into `base`.
    - If a field is present in `update` as a dict and exists in `base` as a dict, recurse.
    - If a field is present in `update` as None or primitive, overwrite `base[key]`.
    - If a field is omitted in `update`, keep `base[key]`.
    """
    for key, value in update.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


class StateManager:
    """
    Thread-safe, in-memory state manager for Smart Eco Garden telemetry.
    Strictly temporary state: restarts clear the state. No database or disk persistence.
    """

    def __init__(
        self,
        timeout_seconds: float = 30.0,
        clock_fn: Optional[Callable[[], datetime]] = None,
    ):
        self.timeout_seconds = timeout_seconds
        self.clock_fn = clock_fn or (lambda: datetime.now(timezone.utc))
        self._lock = threading.Lock()
        self._state: Optional[Dict[str, Any]] = None
        self._last_seen_at: Optional[datetime] = None
        self._has_telemetry: bool = False
        self._was_online: bool = False

    def reset(self) -> None:
        """Resets state for clean test isolation."""
        with self._lock:
            self._state = None
            self._last_seen_at = None
            self._has_telemetry = False
            self._was_online = False

    def is_online(self) -> bool:
        """Returns True if telemetry has been received within `timeout_seconds`."""
        with self._lock:
            if self._last_seen_at is None:
                return False
            now = self.clock_fn()
            delta = (now - self._last_seen_at).total_seconds()
            return delta <= self.timeout_seconds

    def update_telemetry(self, payload: TelemetryPayload) -> str:
        """
        Receives new telemetry, updates in-memory state with recursive merge,
        updates timestamps, and returns the ISO 8601 UTC receipt timestamp.
        """
        now = self.clock_fn()
        receipt_iso = now.isoformat()

        # Extract only explicitly set fields to enable partial merge
        update_dict = payload.model_dump(exclude_unset=True)

        with self._lock:
            if self._state is None:
                self._state = copy.deepcopy(CANONICAL_TEMPLATE)

            deep_merge(self._state, update_dict)

            # Ensure backend-derived system timestamps and status
            self._state["system"]["last_update"] = receipt_iso
            self._state["system"]["status"] = "online"

            self._last_seen_at = now
            self._has_telemetry = True
            self._was_online = True

        return receipt_iso

    def check_timeout_transition(self) -> bool:
        """
        Returns True once when device transitions from online to offline.
        Subsequent calls while offline return False to prevent repeated notification spam.
        """
        with self._lock:
            if self._last_seen_at is None:
                return False

            now = self.clock_fn()
            current_online = (now - self._last_seen_at).total_seconds() <= self.timeout_seconds

            if self._was_online and not current_online:
                self._was_online = False
                if self._state is not None:
                    self._state["system"]["status"] = "offline"
                return True
            elif current_online:
                self._was_online = True

            return False

    def get_status_response(self) -> StatusResponse:
        """Constructs the canonical StatusResponse with current derived state."""
        with self._lock:
            if not self._has_telemetry or self._state is None:
                return StatusResponse(
                    online=False,
                    last_seen=None,
                    has_telemetry=False,
                    state=None,
                )

            now = self.clock_fn()
            online = (now - self._last_seen_at).total_seconds() <= self.timeout_seconds
            self._state["system"]["status"] = "online" if online else "offline"

            return StatusResponse(
                online=online,
                last_seen=self._last_seen_at.isoformat(),
                has_telemetry=True,
                state=copy.deepcopy(self._state),
            )
