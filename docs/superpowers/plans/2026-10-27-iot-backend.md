# Smart Eco Garden Real-Time IoT Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a small, reliable, in-memory real-time FastAPI backend for the Smart Eco Garden student IoT project that ingests telemetry from ESP32 via HTTP POST, tracks online/offline status with configurable timeouts, and broadcasts updates via WebSocket to Next.js dashboard clients without any databases, persistence, or remote actuator control.

**Architecture:** ESP32 sends telemetry payloads via `POST /api/telemetry` -> FastAPI validates using Pydantic -> in-memory StateManager performs deep recursive merge, derives connection status, and updates UTC last_seen/last_update -> ConnectionManager broadcasts updated snapshot to WebSocket clients on `/ws/status` -> Background lifespan task monitors timeout transitions and notifies clients if the device goes offline.

**Tech Stack:** Python 3.11, FastAPI, Pydantic v2 / Pydantic Settings, Uvicorn, WebSockets (Starlette), Pytest, HTTPX (TestClient).

**Spec:** User request and canonical contract specification.

## Global Constraints

- No database (PostgreSQL, Supabase, SQLite, ORM, migrations, Redis) - strictly prohibited.
- No MQTT, no historical logs, no persistent sensor history.
- No remote actuator commands or moving firmware logic (irrigation, door, lighting, flood) to backend.
- Strictly temporary in-memory state. Restart clears state.
- Prohibited fields (must not be added): `water_level_raw`, `water_level_status`, `water tank level`, `water volume`, historical readings.
- Initial state before any telemetry: `has_telemetry = False`, `online = False`, `last_seen = None`, `state = None`.
- Deterministic tests only: injectable/mockable clock, no arbitrary sleeps.

## Review Focus

1. Partial update payload omitting nested fields must preserve previous nested fields (e.g. sending only temperature should not delete humidity).
2. Explicit `null` in payload must set field to `null` (marking reading unavailable) rather than being ignored or reverted.
3. Prohibited/extra fields must not leak into the telemetry state or be exposed as actual measurements.
4. Offline transition must broadcast only once upon state transition, not repeatedly every check tick.
5. Inactive/disconnected WebSocket connections must be caught, cleaned up, and not leak memory or block subsequent broadcasts.

---

### Task 1: Environment & Project Scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Test: `backend/tests/__init__.py`, `backend/tests/test_config.py`

- [ ] Write failing test in `backend/tests/test_config.py` testing config loading defaults and environment variable overrides (`TELEMETRY_TIMEOUT_SECONDS`, `TELEMETRY_API_KEY`, `CORS_ORIGINS`).
- [ ] Run test to verify it fails (`pytest backend/tests/test_config.py`).
- [ ] Implement `backend/app/config.py` using `pydantic-settings` or `pydantic` BaseSettings with sensible defaults (`PORT=8000`, `HOST=0.0.0.0`, `TELEMETRY_TIMEOUT_SECONDS=30`, `CORS_ORIGINS=["http://localhost:3000"]`, `TELEMETRY_API_KEY=None`).
- [ ] Create `backend/.env.example` and `backend/requirements.txt`.
- [ ] Run pytest to verify `test_config.py` passes.
- [ ] Commit changes.

### Task 2: Pydantic Schemas for Canonical Telemetry

**Files:**
- Create: `backend/app/schemas.py`
- Test: `backend/tests/test_schemas.py`

- [ ] Write failing test in `backend/tests/test_schemas.py` testing canonical telemetry validation, partial payloads, nullable fields, rejecting malformed types, and forbidding extra/unimplemented fields (`water_level_raw`).
- [ ] Run test to verify it fails.
- [ ] Implement Pydantic models in `backend/app/schemas.py`:
  - `ProjectInfo`: name, version, controller, sensor_controller, connection, wifi_ssid, local_ip
  - `SystemInfo`: status, power_voltage, power_unit, last_update
  - `IrrigationInfo`: mode, pump, relay, rain_lock, max_run_seconds
  - `GreenhouseInfo`: temperature, temperature_unit, humidity, humidity_unit, soil_moisture_raw, soil_status, light_raw, light_status, irrigation
  - `SmartDoorInfo`: status, servo_angle, keypad_enabled, password_required, auto_close_seconds
  - `NeoPixelInfo`: count, status, brightness
  - `ParkingInfo`: distance_cm, vehicle_detected, detection_threshold_cm, neopixel
  - `FloodPreventionInfo`: rain_sensor_raw, is_raining, pump, relay, mode, implementation_status
  - `SecurityInfo`: vibration_detected, alarm
  - `TelemetryPayload`: Top-level optional models for partial updates, with `model_config = ConfigDict(extra="forbid")`.
  - `StatusResponse`: `online`, `last_seen`, `has_telemetry`, `state`
- [ ] Run pytest to verify `test_schemas.py` passes.
- [ ] Commit changes.

### Task 3: In-Memory StateManager with Deep Recursive Merge and Timeouts

**Files:**
- Create: `backend/app/state_manager.py`
- Test: `backend/tests/test_state_manager.py`

- [ ] Write failing tests in `backend/tests/test_state_manager.py`:
  - Initial state: `has_telemetry=False`, `is_online=False`, `last_seen=None`, `get_state()=None`.
  - Telemetry arrival: updates state, sets `last_seen` and `system.last_update` using injected clock.
  - Deep recursive merge: partial update updates only targeted nested keys; explicit `None` sets key to `None`; omitted keys keep previous values.
  - Timeout check: `is_online()` becomes False after `timeout_seconds`.
  - Transition check: `check_timeout_transition()` returns True only on the first transition from online -> offline.
- [ ] Run test to verify it fails.
- [ ] Implement `backend/app/state_manager.py`:
  - Thread/async-safe `StateManager` class with lock.
  - Injectable `clock_fn` (defaults to `lambda: datetime.now(timezone.utc)`).
  - Recursive dict merger supporting partial updates and explicit null handling.
  - Transition tracking for online -> offline status changes.
- [ ] Run pytest to verify `test_state_manager.py` passes.
- [ ] Commit changes.

### Task 4: WebSocket ConnectionManager

**Files:**
- Create: `backend/app/connection_manager.py`
- Test: `backend/tests/test_connection_manager.py`

- [ ] Write failing test in `backend/tests/test_connection_manager.py` for connection tracking, immediate state delivery on connect, broadcasting messages, and dead connection cleanup when send fails.
- [ ] Run test to verify it fails.
- [ ] Implement `ConnectionManager` in `backend/app/connection_manager.py`:
  - `connect(websocket)`
  - `disconnect(websocket)`
  - `broadcast(message: dict)` with exception catching to remove stale connections without blocking.
- [ ] Run pytest to verify `test_connection_manager.py` passes.
- [ ] Commit changes.

### Task 5: HTTP Endpoints & API Key Authentication

**Files:**
- Create: `backend/app/routes.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_health.py`, `backend/tests/test_status.py`, `backend/tests/test_telemetry.py`

- [ ] Write failing tests for:
  - `GET /api/health` -> 200 `{"status": "ok", ...}`
  - `GET /api/status` before any telemetry -> 200 with `has_telemetry=False`, `online=False`, `state=None`
  - `POST /api/telemetry` with valid payload -> 200 with receipt timestamp, updates `GET /api/status`
  - `POST /api/telemetry` with malformed JSON / prohibited fields -> 422
  - `POST /api/telemetry` with API Key auth (when configured: 401 on missing/wrong key, 200 on valid key)
- [ ] Run tests to verify they fail.
- [ ] Implement `backend/app/routes.py` with FastAPI router:
  - Health endpoint `GET /api/health`
  - Status endpoint `GET /api/status`
  - Telemetry ingestion `POST /api/telemetry` with optional API key dependency (`X-API-Key`).
- [ ] Implement `backend/app/main.py` with FastAPI app, CORS middleware, route registration.
- [ ] Run pytest to verify tests pass.
- [ ] Commit changes.

### Task 6: WebSocket Endpoint & Offline Timeout Background Task

**Files:**
- Modify: `backend/app/routes.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_websocket.py`, `backend/tests/test_offline.py`

- [ ] Write failing tests for:
  - WebSocket `/ws/status` connection: receives snapshot immediately.
  - WebSocket receives update broadcast when `POST /api/telemetry` is called.
  - Disconnected client cleanup.
  - Background timeout task detects offline state and broadcasts status change once.
- [ ] Run tests to verify they fail.
- [ ] Implement WebSocket endpoint `/ws/status` in `backend/app/routes.py`.
- [ ] Implement async background monitor in `backend/app/main.py` (lifespan) checking `check_timeout_transition()` periodically.
- [ ] Run pytest to verify all WebSocket and offline tests pass.
- [ ] Commit changes.

### Task 7: Documentation, Verification, and Polish

**Files:**
- Create: `backend/README.md`
- Test: Run full test suite with coverage

- [ ] Run the complete test suite (`pytest -v backend/tests`).
- [ ] Write comprehensive `backend/README.md` containing:
  - Prerequisites and virtual environment setup.
  - Dependency installation.
  - Configuration options (.env description).
  - Running backend with uvicorn.
  - Swagger documentation URL (`/docs`).
  - Sample curl and Postman commands for telemetry ingestion.
  - Sample WebSocket connection testing instructions (e.g. using `wscat` or browser console).
  - Detailed explanation of in-memory behavior before first telemetry and after restart.
  - Next.js frontend integration guide.
- [ ] Verify no database, ORM, Redis, MQTT, or remote actuator control code exists anywhere.
- [ ] Final commit.
