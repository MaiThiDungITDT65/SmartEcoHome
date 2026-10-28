/**
 * Smart Eco Garden Canonical Data Contracts
 * Reflects the backend FastAPI schema exactly.
 */

export interface ProjectInfo {
  name: string;
  version: string;
  controller: string;
  sensor_controller: string;
  connection: string;
  wifi_ssid: string | null;
  local_ip: string | null;
}

export interface SystemInfo {
  status: string; // "online" | "offline"
  power_voltage: number | null;
  power_unit: string;
  last_update: string | null;
}

export interface IrrigationInfo {
  mode: string; // "auto" | "manual"
  pump: string; // "off" | "on"
  relay: boolean;
  rain_lock: boolean;
  max_run_seconds: number;
}

export interface GreenhouseInfo {
  temperature: number | null;
  temperature_unit: string;
  humidity: number | null;
  humidity_unit: string;
  soil_moisture_raw: number | null;
  soil_status: string | null;
  light_raw: number | null;
  light_status: string | null;
  irrigation: IrrigationInfo;
}

export interface SmartDoorInfo {
  status: string; // "closed" | "open"
  servo_angle: number | null;
  keypad_enabled: boolean;
  password_required: boolean;
  auto_close_seconds: number;
}

export interface NeoPixelInfo {
  count: number;
  status: string | null;
  brightness: number;
}

export interface ParkingInfo {
  distance_cm: number | null;
  vehicle_detected: boolean | null;
  detection_threshold_cm: number;
  neopixel: NeoPixelInfo;
}

export interface FloodPreventionInfo {
  rain_sensor_raw: number | null;
  is_raining: boolean | null;
  pump: string; // "off" | "on"
  relay: boolean;
  mode: string;
  implementation_status: string;
}

export interface SecurityInfo {
  vibration_detected: boolean | null;
  alarm: boolean | null;
}

export interface TelemetryState {
  project: ProjectInfo;
  system: SystemInfo;
  greenhouse: GreenhouseInfo;
  smart_door: SmartDoorInfo;
  parking: ParkingInfo;
  flood_prevention: FloodPreventionInfo;
  security: SecurityInfo;
}

export interface StatusResponse {
  online: boolean;
  last_seen: string | null;
  has_telemetry: boolean;
  state: TelemetryState | null;
}

export interface WebSocketMessage {
  event: "snapshot" | "update" | "status_change";
  online: boolean;
  last_seen: string | null;
  has_telemetry: boolean;
  state: TelemetryState | null;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";
