# Smart Eco Garden Real-Time Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, responsive, real-time IoT monitoring dashboard for Smart Eco Garden using Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and the UI/UX Pro Max Eco-Technology design system.

**Architecture:** Next.js client establishes a resilient WebSocket connection to FastAPI (`/ws/status`) with initial HTTP snapshot hydration (`GET /api/status`), exponential backoff auto-reconnect, and race condition prevention. State updates feed a high-density, read-only monitoring interface organized by IoT subsystems (Overview, Greenhouse, Smart Door, Smart Parking, Flood Prevention, and Security).

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript (strict mode), Tailwind CSS, Lucide React icons.

**Spec:** User prompt requirements, UI/UX Pro Max Eco-Technology tokens, and FastAPI canonical backend contract.

## Global Constraints

- Monitoring only: NO database, Supabase, Postgres, MQTT, persistent history, or remote actuator control.
- NO buttons/switches to toggle pumps, servos, lights, or modes.
- NO invented sensor readings (e.g. converting raw ADC to fake % or fake lux).
- NO water level cards or deferred fields (`water_level_raw`, `water_level_status`, `water_tank_level`).
- Temperature and humidity overview cards render only when real telemetry readings are present.
- Preserve zero and `false` values (do not hide them with simple truthiness checks).
- Show "Chưa có dữ liệu" (or "-" / "Unknown") for unavailable fields.
- Clean up all sockets, timeouts, and event listeners on unmount (React Strict Mode compliant).
- Pass Next.js lint, TypeScript `tsc --noEmit`, and `npm run build`.

## Review Focus

1. Initial loading & empty state: When backend has no telemetry (`has_telemetry: false`), dashboard displays clear "Waiting for ESP32 telemetry" without throwing runtime errors or displaying dummy numbers.
2. Stale data & offline indication: When ESP32 times out, the UI visibly marks state as offline/stale while retaining last known values.
3. Race condition prevention: If WebSocket message arrives before slow initial HTTP snapshot finishes, old HTTP snapshot must not overwrite new live state.
4. Raw sensor rendering: `soil_moisture_raw` and `light_raw` must show raw ADC numbers and categorical status, never fake percentages.
5. Zero / false value handling: `servo_angle: 0`, `rain_lock: false`, `is_raining: false` must be rendered properly as `0°` and `False` rather than "Chưa có dữ liệu".

---

### Task 1: Frontend Dependencies & Configuration Setup

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/.env.local`
- Modify: `frontend/package.json` (add `lucide-react`)
- Modify: `frontend/tailwind.config.ts` or `app/globals.css` (eco-technology tokens)

- [ ] Install `lucide-react` for clean SVG icons.
- [ ] Create `frontend/.env.example` and `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL`.
- [ ] Configure Tailwind CSS font and color tokens in `frontend/app/globals.css`.
- [ ] Run `npm run lint` or `npm run build` to confirm base scaffolding compiles.

### Task 2: TypeScript Interfaces & Canonical Data Contracts

**Files:**
- Create: `frontend/types/smart-garden.ts`
- Create: `frontend/lib/dashboard-utils.ts`

- [ ] Define comprehensive TypeScript types matching the backend schema exactly (`TelemetryState`, `StatusResponse`, `WebSocketMessage`, `ConnectionState`).
- [ ] Implement utility helpers in `lib/dashboard-utils.ts`:
  - `formatTimestamp(isoString: string | null): string`
  - `isDataStale(lastSeenIso: string | null, timeoutSeconds?: number): boolean`
  - `formatRawSensor(val: number | null | undefined, unit?: string): string`
- [ ] Verify typecheck with `npx tsc --noEmit`.

### Task 3: Resilient WebSocket & HTTP Sync Hook (`useSmartGardenSocket`)

**Files:**
- Create: `frontend/hooks/use-smart-garden-socket.ts`
- Create: `frontend/lib/api.ts`

- [ ] Implement `fetchInitialStatus()` in `lib/api.ts` to call `GET /api/status`.
- [ ] Implement `useSmartGardenSocket()` custom hook:
  - Connects to WebSocket with exponential backoff (1s -> 2s -> 4s -> max 10s).
  - Hydrates via HTTP snapshot on mount.
  - Race condition guard (tracks timestamp of latest state, ignores older HTTP response).
  - Handles `snapshot`, `update`, `status_change` events.
  - React Strict Mode resilient cleanup (cancels reconnection timeouts, closes WS).
  - Provides manual refresh function.
- [ ] Verify typecheck with `npx tsc --noEmit`.

### Task 4: Base UI Components (Header, Badges, Metrics)

**Files:**
- Create: `frontend/components/dashboard-header.tsx`
- Create: `frontend/components/connection-status.tsx`
- Create: `frontend/components/status-badge.tsx`
- Create: `frontend/components/sensor-card.tsx`

- [ ] Implement `StatusBadge`: semantic variants (success, warning, danger, neutral, info) with accessible contrast.
- [ ] Implement `ConnectionStatus`: shows real-time WebSocket state (connected, reconnecting, disconnected) and ESP32 status (online, offline, waiting).
- [ ] Implement `DashboardHeader`: project brand identity, connection pills, last updated time, and manual refresh button.
- [ ] Implement `SensorCard`: reusable metric card supporting raw readings, status tags, unit badges, and loading placeholders.

### Task 5: Subsystem Section Components

**Files:**
- Create: `frontend/components/greenhouse-section.tsx`
- Create: `frontend/components/smart-door-section.tsx`
- Create: `frontend/components/parking-section.tsx`
- Create: `frontend/components/rain-prevention-section.tsx`
- Create: `frontend/components/security-section.tsx`
- Create: `frontend/components/system-metadata-section.tsx`

- [ ] Implement `GreenhouseSection`: Temperature & humidity (when available), raw soil moisture & status, raw light & status, read-only irrigation indicators (pump, relay, rain lock, max run time).
- [ ] Implement `SmartDoorSection`: Door status (open/closed), servo angle, keypad enabled, password required, auto-close timer.
- [ ] Implement `ParkingSection`: Ultrasonic distance, vehicle detected badge, threshold, NeoPixel strip status/brightness.
- [ ] Implement `RainPreventionSection`: Rain sensor raw, is_raining, drainage pump, relay, mode, implementation status (explicit note: water tank level deferred).
- [ ] Implement `SecuritySection`: Vibration detection, alarm state.
- [ ] Implement `SystemMetadataSection`: Hardware gateway (ESP32, Arduino UNO, WiFi SSID, Local IP, Power voltage).

### Task 6: Main Dashboard Integration & Responsive Layout

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] Assemble `app/page.tsx`:
  - Hook integration with `useSmartGardenSocket()`.
  - Loading skeleton state before first telemetry or when connecting.
  - Quick summary cards row (temperature, humidity, soil, light, rain, parking, voltage).
  - Grid of subsystem sections.
  - Footer with connection heartbeat and read-only telemetry notice.
- [ ] Set HTML title, favicon, and meta tags in `app/layout.tsx`.

### Task 7: Verification & Documentation

**Files:**
- Create: `frontend/README.md`
- Test: Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

- [ ] Run typecheck (`npx tsc --noEmit`).
- [ ] Run Next.js linter (`npm run lint`).
- [ ] Run production build (`npm run build`) and confirm 0 errors.
- [ ] Write `frontend/README.md` with:
  - Architecture and real-time data flow.
  - Environment variables guide.
  - Development and production commands.
  - Manual verification checklist.
