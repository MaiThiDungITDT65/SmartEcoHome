# Smart Eco Garden - Real-Time IoT Dashboard

A modern, responsive, high-density operations dashboard for the **Smart Eco Garden** student IoT project. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS v4**, and **Lucide React**.

Designed according to the **UI/UX Pro Max** Eco-Technology design system.

---

## 1. Architecture & Real-Time Data Flow

```text
+-------------------+        HTTP POST        +-----------------------------+
|    ESP32 Wi-Fi    | ----------------------> |       FastAPI Backend       |
|      Gateway      |   (/api/telemetry)      | (Strictly In-Memory State)   |
+-------------------+                         +-----------------------------+
                                                             |
                                                             | 1. HTTP Snapshot (/api/status)
                                                             | 2. WebSocket Stream (/ws/status)
                                                             v
                                              +-----------------------------+
                                              |      Next.js Dashboard      |
                                              |  (useSmartGardenSocket)     |
                                              +-----------------------------+
```

### Architectural Guarantees:
- **Strictly Monitoring Only:** No database, no Supabase, no Postgres, no MQTT. No buttons or interactive controls that trigger pumps, lights, servos, or modes.
- **Zero Invented Data:** If a sensor reading has not arrived from ESP32, it displays `"Chưa có dữ liệu"`. No fake percentages or lux conversions for raw ADC readings.
- **Race Condition Prevention:** The custom `useSmartGardenSocket` hook tracks monotonic state timestamps so that a slower HTTP snapshot never overwrites a newer WebSocket packet.
- **Automatic Exponential Backoff Reconnection:** Automatically reconnects upon network or server interruption (1s -> 2s -> 4s -> max 10s) with clean timer/socket teardown on unmount (React Strict Mode compliant).
- **Stale State Indication:** If the ESP32 stops transmitting for longer than 30 seconds, data is clearly flagged with a `"Cũ (>30s)"` badge while retaining last known values.

---

## 2. Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Default Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | FastAPI HTTP Base URL for snapshot fetch & health check |
| `NEXT_PUBLIC_WS_URL` | `ws://127.0.0.1:8000/ws/status` | WebSocket endpoint for real-time telemetry updates |

---

## 3. Getting Started

### Prerequisites:
- Node.js 18.18+ (tested on Node v22.18.0)
- npm 10+ (tested on npm 11.16.0)
- Smart Eco Garden FastAPI backend running on `http://127.0.0.1:8000`

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 3: Run Production Build
```bash
npm run build
npm run start
```

---

## 4. Quality & Verification Commands

All quality gates pass with zero errors:

- **TypeScript Typecheck:**
  ```bash
  npx tsc --noEmit
  ```
- **ESLint Linting:**
  ```bash
  npm run lint
  ```
- **Optimized Production Build:**
  ```bash
  npm run build
  ```

---

## 5. End-to-End Verification Checklist

1. **Before any ESP32 telemetry:**
   - Dashboard displays `Chờ ESP32 gửi dữ liệu...`
   - Temperature & humidity overview cards are not rendered (only real readings appear).
   - All other metrics cleanly display `"Chưa có dữ liệu"`.
2. **Ingesting live telemetry:**
   - Post simulated data using the backend script:
     ```bash
     python ../backend/scripts/live_test.py
     ```
   - Dashboard immediately reflects new readings across all sections via WebSocket with zero page reload.
3. **Disconnection & Reconnection:**
   - Stop backend server: status pill instantly changes to `Mất kết nối WS` -> `Đang kết nối lại WS...`.
   - Restart backend server: dashboard automatically reconnects and synchronizes state.
4. **Offline Timeout:**
   - Wait 30 seconds without posting new telemetry: status pill switches to `ESP32 Offline`, and data cards display subtle `Cũ` badges.
