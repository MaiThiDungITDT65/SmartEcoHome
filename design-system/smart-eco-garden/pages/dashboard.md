# Dashboard Page Overrides: Smart Eco Garden Real-Time IoT Dashboard

> **PROJECT:** Smart Eco Garden
> **Target:** Operations & Telemetry Monitoring Dashboard
> **Aesthetic:** Eco-Technology (Clean, organic precision, high data density, no SaaS marketing elements)

---

## 1. Design Tokens & Theme Specification

### Color Palette (Eco-Technology)
- **Background:** `#F8FAFC` (Slate-50) / `#F1F5F9` (Slate-100) - Light, crisp, neutral background
- **Surface / Cards:** `#FFFFFF` (White) with subtle border `rgba(15, 23, 42, 0.08)` and soft shadow `shadow-xs` / `shadow-sm`
- **Primary / Brand:** Deep Forest Green `#064E3B` (Emerald-900) / `#047857` (Emerald-700)
- **Secondary / Accent:** Soft Sage `#10B981` (Emerald-500) / `#D1FAE5` (Emerald-100)
- **Text Primary:** `#0F172A` (Slate-900) - High contrast, WCAG AAA compliant
- **Text Secondary / Muted:** `#475569` (Slate-600) / `#64748B` (Slate-500)
- **Status Semantic Colors:**
  - **Online / Active / Normal:** Emerald `#059669` / `#10B981` (badge: `bg-emerald-50 text-emerald-700 border-emerald-200`)
  - **Warning / Stale / Pending:** Amber `#D97706` (badge: `bg-amber-50 text-amber-700 border-amber-200`)
  - **Offline / Closed / Danger:** Rose / Slate `#E11D48` / `#64748B` (badge: `bg-rose-50 text-rose-700 border-rose-200` or `bg-slate-100 text-slate-700 border-slate-200`)

### Typography
- **Headings & Labels:** Sans-serif (Inter / System Sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- **Metric Values & Timestamps:** Tabular numbers with Monospace font (`ui-monospace, "Fira Code", monospace`)
- **Visual Hierarchy:**
  - Section titles: `text-sm font-semibold tracking-wider uppercase text-emerald-950/70`
  - Big metrics: `text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900`
  - Unit badges: `text-xs font-medium text-slate-500 ml-1`
  - Sub-labels: `text-xs font-medium text-slate-500`

### Layout & Information Density
- **Max Width:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6`
- **Grid Structure:**
  - Header: Sticky top bar with brand mark, connection pills (WS & ESP32), last seen timestamp, and manual snapshot trigger.
  - Quick Telemetry Grid: 6-column / responsive grid for key sensor readings (Temperature, Humidity, Soil Raw, Light Raw, Rain, Parking).
  - Detailed Subsystem Cards: 2-column or 3-column responsive grid:
    1. Greenhouse & Irrigation
    2. Smart Access & Security
    3. Parking Guidance & Rain Protection
    4. Hardware & Gateway Telemetry

### Anti-Patterns Strictly Avoided
- No buttons or controls that imply changing pumps, servos, lights, or modes (read-only telemetry).
- No fake charts, pricing tables, sales banners, or marketing testimonials.
- No labeling raw ADC as % or lux.
- No invented water level cards.
