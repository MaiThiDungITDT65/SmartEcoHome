import math
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProjectPayload(StrictBaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    controller: Optional[str] = None
    sensor_controller: Optional[str] = None
    connection: Optional[str] = None
    wifi_ssid: Optional[str] = None
    local_ip: Optional[str] = None


class SystemPayload(StrictBaseModel):
    status: Optional[str] = None
    power_voltage: Optional[float] = Field(default=None, allow_inf_nan=False)
    power_unit: Optional[str] = None
    last_update: Optional[str] = None


class IrrigationPayload(StrictBaseModel):
    mode: Optional[str] = None
    pump: Optional[str] = None
    relay: Optional[bool] = None
    rain_lock: Optional[bool] = None
    max_run_seconds: Optional[int] = None


class GreenhousePayload(StrictBaseModel):
    temperature: Optional[float] = Field(default=None, allow_inf_nan=False)
    temperature_unit: Optional[str] = None
    humidity: Optional[float] = Field(default=None, allow_inf_nan=False)
    humidity_unit: Optional[str] = None
    soil_moisture_raw: Optional[int] = None
    soil_status: Optional[str] = None
    light_raw: Optional[int] = None
    light_status: Optional[str] = None
    irrigation: Optional[IrrigationPayload] = None


class SmartDoorPayload(StrictBaseModel):
    status: Optional[str] = None
    servo_angle: Optional[float] = Field(default=None, allow_inf_nan=False)
    keypad_enabled: Optional[bool] = None
    password_required: Optional[bool] = None
    auto_close_seconds: Optional[int] = None


class NeoPixelPayload(StrictBaseModel):
    count: Optional[int] = None
    status: Optional[str] = None
    brightness: Optional[int] = None


class ParkingPayload(StrictBaseModel):
    distance_cm: Optional[float] = Field(default=None, allow_inf_nan=False)
    vehicle_detected: Optional[bool] = None
    detection_threshold_cm: Optional[float] = Field(default=None, allow_inf_nan=False)
    neopixel: Optional[NeoPixelPayload] = None


class FloodPreventionPayload(StrictBaseModel):
    rain_sensor_raw: Optional[int] = None
    is_raining: Optional[bool] = None
    pump: Optional[str] = None
    relay: Optional[bool] = None
    mode: Optional[str] = None
    implementation_status: Optional[str] = None


class SecurityPayload(StrictBaseModel):
    vibration_detected: Optional[bool] = None
    alarm: Optional[bool] = None


class TelemetryPayload(StrictBaseModel):
    project: Optional[ProjectPayload] = None
    system: Optional[SystemPayload] = None
    greenhouse: Optional[GreenhousePayload] = None
    smart_door: Optional[SmartDoorPayload] = None
    parking: Optional[ParkingPayload] = None
    flood_prevention: Optional[FloodPreventionPayload] = None
    security: Optional[SecurityPayload] = None


class StatusResponse(StrictBaseModel):
    online: bool
    last_seen: Optional[str] = None
    has_telemetry: bool
    state: Optional[Dict[str, Any]] = None


class TelemetryResponse(StrictBaseModel):
    status: str = "success"
    received_at: str
    connected: bool
