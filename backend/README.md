# Smart Eco Garden - Real-Time IoT Backend

A small, high-performance, in-memory real-time backend for the **Smart Eco Garden** student IoT project. Built with **Python 3.11**, **FastAPI**, **Pydantic v2**, and **WebSockets**.

---

## 1. Architecture Overview

```text
+-------------------+        HTTP POST        +-----------------------------+
|    ESP32 Wi-Fi    | ----------------------> |       FastAPI Backend       |
|      Gateway      |   (/api/telemetry)      | (Strictly In-Memory State)   |
+-------------------+                         +-----------------------------+
          ^                                                  |
          | I2C / UART                                       | WebSocket Broadcast
          v                                                  | (/ws/status)
+-------------------+                                        v
|    Arduino UNO    |                             +-----------------------------+
| Sensor Controller |                             |     Next.js Dashboards      |
+-------------------+                             +-----------------------------+
```

### Architectural Guarantees:
- **Telemetry Ingestion & Transport Only:** All automatic irrigation, lighting, rain response, smart door, and flood prevention thresholds are executed directly on the Arduino/ESP32 firmware. No actuator controls or automatic logic exist in Python.
- **Strictly In-Memory State:** No databases (PostgreSQL, SQLite, Supabase), ORMs, Redis, or disk persistence. Restarting the backend clears state to a clean unknown baseline.
- **Zero Event Logging:** Payloads are not persisted as historical time-series logs. Only the latest snapshot is maintained.
- **Deep Recursive Merge:** Partial telemetry updates update only targeted fields without erasing previously received fields that were omitted in subsequent packets.
- **Explicit Nulls:** Passing explicit `null` marks a sensor reading as unavailable or failed without inferring default measurements.

---

## 2. Prerequisites

- Python 3.10+ (tested and verified on Python 3.11.9)
- `pip` package manager
- (Optional) `wscat` or browser console for WebSocket testing

---

## 3. Setup and Installation

### Step 1: Create Virtual Environment
```bash
# From the repository root:
python -m venv .venv

# Activate on Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# Activate on Linux/macOS:
source .venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

Environment variables:
| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | Server bind host |
| `PORT` | `8000` | Server bind port |
| `CORS_ORIGINS` | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed dashboard origins (JSON array) |
| `TELEMETRY_TIMEOUT_SECONDS` | `30` | Inactivity threshold before marking device offline |
| `TIMEOUT_CHECK_INTERVAL_SECONDS` | `1.0` | Period between background checks for offline status transitions |
| `TELEMETRY_API_KEY` | `""` (Empty / disabled) | Optional authentication token required in `X-API-Key` header |

---

## 4. Running the Server

Start the FastAPI application with Uvicorn:
```bash
# Navigate to the backend directory or ensure PYTHONPATH includes backend:
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation (Swagger UI):
- **http://localhost:8000/docs**
- **http://localhost:8000/redoc**

---

## 5. API Reference

### 5.1 Service Health
`GET /api/health`
- Confirms backend service uptime.
```bash
curl -X GET http://localhost:8000/api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Smart Eco Garden Backend",
  "version": "1.0"
}
```

---

### 5.2 Device & Garden Status
`GET /api/status`
- Returns current server-derived connection state, last seen timestamp, and in-memory telemetry.
- Fully operational even **before** the first ESP32 packet has arrived.

**Response before any telemetry has arrived (200 OK):**
```json
{
  "online": false,
  "last_seen": null,
  "has_telemetry": false,
  "state": null
}
```

**Response after telemetry has been ingested (200 OK):**
```json
{
  "online": true,
  "last_seen": "2026-10-27T12:00:00+00:00",
  "has_telemetry": true,
  "state": {
    "project": {
      "name": "Smart Eco Garden",
      "version": "1.0",
      "controller": "ESP32",
      "sensor_controller": "Arduino UNO",
      "connection": "WiFi",
      "wifi_ssid": "SmartEcoGarden",
      "local_ip": "192.168.4.1"
    },
    "system": {
      "status": "online",
      "power_voltage": 5.0,
      "power_unit": "V",
      "last_update": "2026-10-27T12:00:00+00:00"
    },
    "greenhouse": {
      "temperature": 27.5,
      "temperature_unit": "C",
      "humidity": 64.0,
      "humidity_unit": "%",
      "soil_moisture_raw": 550,
      "soil_status": "moist",
      "light_raw": 720,
      "light_status": "bright",
      "irrigation": {
        "mode": "auto",
        "pump": "off",
        "relay": false,
        "rain_lock": false,
        "max_run_seconds": 5
      }
    },
    "smart_door": {
      "status": "closed",
      "servo_angle": 0.0,
      "keypad_enabled": true,
      "password_required": true,
      "auto_close_seconds": 5
    },
    "parking": {
      "distance_cm": 28.0,
      "vehicle_detected": false,
      "detection_threshold_cm": 15.0,
      "neopixel": {
        "count": 12,
        "status": "green",
        "brightness": 5
      }
    },
    "flood_prevention": {
      "rain_sensor_raw": 980,
      "is_raining": false,
      "pump": "off",
      "relay": false,
      "mode": "auto",
      "implementation_status": "pending"
    },
    "security": {
      "vibration_detected": false,
      "alarm": false
    }
  }
}
```

---

### 5.3 Ingest Telemetry
`POST /api/telemetry`
- Ingests simulated or live ESP32 telemetry.
- Updates in-memory state via deep merge.
- Updates UTC receipt timestamp.
- Immediately broadcasts state to all active WebSocket clients.

#### Sample Curl Request (Simulated Test Data):
```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "greenhouse": {
      "temperature": 28.3,
      "humidity": 62.5,
      "soil_moisture_raw": 510,
      "soil_status": "moist",
      "irrigation": {
        "pump": "on",
        "relay": true
      }
    },
    "parking": {
      "distance_cm": 10.2,
      "vehicle_detected": true
    }
  }'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "received_at": "2026-10-27T12:05:30.123456+00:00",
  "connected": true
}
```

#### With API Key Enabled:
If `TELEMETRY_API_KEY=your_secret_key` is set:
```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secret_key" \
  -d '{"greenhouse": {"temperature": 26.0}}'
```

---

## 6. Real-Time WebSocket Testing

### WebSocket Endpoint:
`ws://localhost:8000/ws/status`

### Connection Lifecycle:
1. **Immediate Snapshot (`event: "snapshot"`):**
   Immediately upon opening the connection, the client receives the current snapshot of device state (even if `has_telemetry` is false).
2. **Telemetry Updates (`event: "update"`):**
   Whenever a valid POST payload arrives from the ESP32, all clients receive the updated state.
3. **Offline Detection (`event: "status_change"`):**
   If the device stops sending packets for longer than `TELEMETRY_TIMEOUT_SECONDS`, a single transition broadcast is dispatched setting `online: false`. The server avoids continuous polling spam.

### Testing with Browser Console:
Open any web browser devtools console (F12) and run:
```javascript
const ws = new WebSocket("ws://localhost:8000/ws/status");

ws.onopen = () => console.log("Connected to Smart Eco Garden WebSocket!");
ws.onmessage = (event) => console.log("Message received:", JSON.parse(event.data));
ws.onclose = () => console.log("Disconnected from WebSocket");
```

### Next.js Frontend Integration:
In your Next.js frontend component:
```typescript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/status";

useEffect(() => {
  const socket = new WebSocket(WS_URL);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event === "snapshot" || data.event === "update" || data.event === "status_change") {
      setGardenState(data.state);
      setIsOnline(data.online);
      setLastSeen(data.last_seen);
    }
  };

  return () => socket.close();
}, []);
```

---

## 7. Running Automated Tests

All tests are deterministic and execute without arbitrary sleeps:
```bash
# Run complete test suite:
$env:PYTHONPATH="backend"; .\.venv\Scripts\pytest.exe -v backend/tests
```

**Test Coverage Highlights:**
- `test_config.py`: Environment variable overrides and defaults.
- `test_schemas.py`: Schema validation, rejection of prohibited fields (`water_level_raw`), non-finite floats (`inf`/`nan`).
- `test_state_manager.py`: Recursive merge, explicit `null` support, omitted field preservation, and timeout transitions.
- `test_connection_manager.py`: WebSocket lifecycle and dead connection pruning.
- `test_health.py`: GET `/api/health` status.
- `test_status.py`: Pre-telemetry baseline and post-telemetry retrieval.
- `test_telemetry.py`: HTTP ingestion, partial merges, prohibited field rejection, and API key authentication.
- `test_websocket.py`: Snapshot on connect, broadcast updates, and clean disconnection.
- `test_offline.py`: Deterministic timeout evaluation with controllable clock.
