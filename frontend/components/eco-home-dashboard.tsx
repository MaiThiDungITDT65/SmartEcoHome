"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, CarFront, CheckCircle2, CloudRain,
  DoorOpen, Droplets, ExternalLink, Gauge, Leaf, Lightbulb, Loader2,
  ParkingCircle, RefreshCcw, ShieldAlert, Sprout, Sun, Thermometer, WifiOff, Waves,
} from "lucide-react";

type Mode = "demo" | "live";
type Command = "door/open" | "door/close" | "water/auto" | "water/manual" | "water/on" | "water/off";
type EcoData = {
  temperature: number | null;
  humidity: number | null;
  soilRaw: number | null;
  lightRaw: number | null;
  rainRaw: number | null;
  raining: boolean;
  vibration: boolean;
  floodRaw: number | null;
  floodAlert: boolean;
  pump1: boolean;
  pump2: boolean | null;
  waterMode: "AUTO" | "MANUAL";
  doorOpen: boolean;
  distanceCm: number | null;
  carDetected: boolean;
  unoConnected: boolean;
  ledRed: boolean;
  ledGreen: boolean;
  ledYellow: boolean;
  soilStatus: string;
};
type ChartSample = { t: number; temperature?: number | null; soilRaw?: number | null; floodRaw?: number | null };
type EcoSnapshot = {
  mode: Mode;
  simulated: boolean;
  connected: boolean;
  error: string | null;
  timestamp: number;
  data: EcoData | null;
  history: ChartSample[];
};

type SensorDraft = { floodRaw: number; soil: number; rain: number; distance: number; vibration: boolean };
const DEFAULT_DRAFT: SensorDraft = { floodRaw: 0, soil: 510, rain: 1020, distance: 16, vibration: false };
const API_ROOT = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function api<T>(path: string, method: "GET" | "POST" = "GET", value?: unknown): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: value === undefined ? undefined : JSON.stringify(value),
    cache: "no-store",
  });
  let result: unknown;
  try { result = await response.json(); } catch { throw new Error(`Máy chủ trả về dữ liệu không hợp lệ (${response.status})`); }
  if (!response.ok) {
    const error = result as { detail?: string };
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return result as T;
}

function fmt(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "--";
  return value.toLocaleString("vi-VN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function StatusPill({ children, color = "neutral" }: { children: React.ReactNode; color?: "neutral" | "green" | "red" | "yellow" }) {
  const colors = {
    neutral: "border-stone-200 bg-stone-50 text-stone-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    yellow: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colors[color]}`}>{children}</span>;
}
function Metric({ label, value, unit, foot, icon: Icon, accent = "emerald" }: {
  label: string; value: string; unit?: string; foot?: string; icon: React.ComponentType<{ className?: string }>;
  accent?: "emerald" | "blue" | "amber" | "rose";
}) {
  const colors = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };
  return <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-stone-500">{label}</span><span className={`rounded-xl p-2 ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div>
    <div className="mt-3 flex items-baseline gap-1.5"><span className="text-2xl font-bold tracking-tight text-stone-900">{value}</span>{unit && <span className="text-xs text-stone-500">{unit}</span>}</div>
    <p className="mt-1 min-h-4 text-[11px] text-stone-500">{foot || "Chưa có dữ liệu"}</p>
  </div>;
}
function Panel({ title, icon: Icon, note, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>; note?: string; children: React.ReactNode;
}) {
  return <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-2.5 border-b border-stone-100 pb-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Icon className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-stone-900">{title}</h2>{note && <p className="mt-1 text-xs leading-5 text-stone-500">{note}</p>}</div></div>
    <div className="pt-4">{children}</div>
  </section>;
}
function ActionButton({ label, onClick, disabled, kind = "primary", busy }: {
  label: string; onClick: () => void; disabled?: boolean; kind?: "primary" | "plain" | "danger"; busy?: boolean;
}) {
  const styles = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    plain: "border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return <button type="button" onClick={onClick} disabled={disabled || busy} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles[kind]}`}>
    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{label}
  </button>;
}
function Lamp({ color, on, label }: { color: "red" | "green" | "yellow"; on: boolean | null; label: string }) {
  const onColors = { red: "bg-red-500 shadow-[0_0_16px_#f87171]", green: "bg-emerald-500 shadow-[0_0_16px_#34d399]", yellow: "bg-amber-400 shadow-[0_0_16px_#fbbf24]" };
  return <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-3"><span className={`h-4 w-4 shrink-0 rounded-full border border-black/10 ${on ? onColors[color] : "bg-stone-200"}`} /><span className="text-xs font-semibold text-stone-700">{label}</span><span className="ml-auto text-xs text-stone-500">{on === null ? "--" : on ? "Sáng" : "Tắt"}</span></div>;
}
function LineChart({ history }: { history: ChartSample[] }) {
  const width = 800, height = 160;
  const points = (key: "soilRaw" | "floodRaw" | "temperature") => history
    .map((r, i) => {
      const v = r[key];
      if (v === null || v === undefined || !Number.isFinite(v)) return null;
      const x = 10 + (i / Math.max(1, history.length - 1)) * (width - 20);
      const scaled = key === "temperature" ? v * 20 : v;
      const y = height - 10 - Math.max(0, Math.min(1200, scaled)) / 1200 * (height - 20);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).filter((x): x is string => x !== null).join(" ");
  const haveData = history.length > 1;
  return <div>
    <div className="flex flex-wrap gap-4 pb-2 text-[11px] text-stone-500"><span>🟢 Độ ẩm đất RAW</span><span>🔴 Mức nước RAW</span><span>🟡 Nhiệt độ ×20</span></div>
    <div className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50 p-2"><svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Biểu đồ xu hướng các cảm biến">
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1="0" y1={8 + i * 36} x2={width} y2={8 + i * 36} stroke="#e7e5e4" strokeWidth="1" />)}
      {haveData && <><polyline points={points("soilRaw")} stroke="#059669" strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" /><polyline points={points("floodRaw")} stroke="#e11d48" strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" /><polyline points={points("temperature")} stroke="#d97706" strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" /></>}
      {!haveData && <text x="400" y="80" fill="#78716c" textAnchor="middle" fontSize="16">Đang thu thập dữ liệu biểu đồ...</text>}
    </svg></div><p className="mt-2 text-[11px] text-stone-500">Biểu đồ chỉ lưu ngắn hạn trong RAM Backend. Không quy đổi ADC sang % nếu chưa hiệu chuẩn.</p>
  </div>;
}

export default function EcoHomeDashboard() {
  const [snapshot, setSnapshot] = useState<EcoSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("Bản Dashboard tích hợp cho Smart Eco Home.");
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<SensorDraft>(DEFAULT_DRAFT);
  const loadingRef = useRef(false);
  const mode = snapshot?.mode || "demo";
  const data = snapshot?.data || null;
  const canControl = !!snapshot && (mode === "demo" || snapshot.connected);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const status = await api<EcoSnapshot>("/api/eco/status");
      setSnapshot(status);
      setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể kết nối Backend"); }
    finally { loadingRef.current = false; }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  async function command(cmd: Command) {
    if (!canControl || busy) return;
    setBusy(cmd);
    try {
      const result = await api<{ simulated: boolean; note?: string }>("/api/eco/command", "POST", { command: cmd });
      setNotice(`${result.simulated ? "MÔ PHỎNG" : "ĐÃ GỬI ESP32"}: ${cmd}. ${result.note || ""}`);
      await refresh();
    } catch (e) { setNotice("LỖI LỆNH: " + (e instanceof Error ? e.message : "Không xác định")); }
    finally { setBusy(null); }
  }
  async function setMode(next: Mode) {
    if (busy || next === mode) return;
    if (next === "live" && !window.confirm("Chuyển sang THIẾT BỊ THẬT? Lệnh điều khiển sẽ gửi đến ESP32 khi có kết nối. Mô hình hiện đang được cất nên bạn có thể giữ MÔ PHỎNG.")) return;
    setBusy("mode");
    try {
      await api("/api/eco/mode", "POST", { mode: next });
      setNotice(next === "demo" ? "Đã bật mô phỏng. Không gửi lệnh tới thiết bị." : "Đã chọn thiết bị thật. Đang kiểm tra kết nối ESP32...");
      await refresh();
    } catch (e) { setNotice("Không đổi được chế độ: " + (e instanceof Error ? e.message : "Lỗi")); }
    finally { setBusy(null); }
  }
  async function applySensors(values: SensorDraft) {
    if (mode !== "demo" || busy) return;
    setBusy("sensors");
    try {
      await api("/api/eco/demo/sensors", "POST", values);
      setNotice("Đã áp dụng tình huống mô phỏng. Không tác động tới mô hình thật.");
      await refresh();
    } catch (e) { setNotice("LỖI MÔ PHỎNG: " + (e instanceof Error ? e.message : "Không xác định")); }
    finally { setBusy(null); }
  }
  const s = (v: string) => data ? v : "--";

  return <div className="min-h-screen bg-[#f5f7f4] text-stone-900">
    <header className="border-b border-emerald-900/10 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-800 p-2.5 text-white"><Leaf className="h-5 w-5" /></div><div><h1 className="text-base font-bold">Smart Eco Garden <span className="text-xs font-normal text-emerald-700">· Smart Eco Home</span></h1><p className="text-[11px] text-stone-500">Arduino UNO R3 · ESP32 · Dashboard demo & điều khiển</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><StatusPill color={mode === "demo" ? "yellow" : snapshot?.connected ? "green" : "red"}>{mode === "demo" ? "MÔ PHỎNG – KHÔNG CÓ THIẾT BỊ THẬT" : snapshot?.connected ? "ESP32 trực tuyến" : "ESP32 ngoại tuyến"}</StatusPill><button type="button" onClick={() => void refresh()} className="rounded-lg border border-stone-200 bg-white p-2 hover:bg-stone-50" aria-label="Làm mới"><RefreshCcw className="h-4 w-4" /></button></div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${mode === "demo" ? "border-amber-200 bg-amber-50 text-amber-900" : snapshot?.connected ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
        {mode === "demo" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : snapshot?.connected ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />}
        <div className="flex-1"><p className="text-sm font-bold">{mode === "demo" ? "Đang dùng dữ liệu MÔ PHỎNG" : snapshot?.connected ? "Đã kết nối ESP32 thật" : "Không có kết nối tới ESP32"}</p><p className="mt-1 text-xs leading-5">{mode === "demo" ? "Giá trị hiển thị được tạo để luyện demo; nút điều khiển chỉ thay đổi mô phỏng. Không phải kết quả đo trực tiếp." : snapshot?.connected ? "Giá trị đọc qua ESP32 /data. Lệnh mở cửa và tưới cây được gửi tới thiết bị." : "Thiết bị chưa kết nối. Các nút điều khiển bị vô hiệu hóa để tránh hiểu nhầm."}</p></div>
        <div className="flex shrink-0 flex-wrap gap-1 rounded-lg border border-stone-200 bg-white/80 p-1"><button type="button" onClick={() => void setMode("demo")} disabled={!!busy} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${mode === "demo" ? "bg-emerald-800 text-white" : "text-stone-600"}`}>Mô phỏng</button><button type="button" onClick={() => void setMode("live")} disabled={!!busy} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${mode === "live" ? "bg-emerald-800 text-white" : "text-stone-600"}`}>Thiết bị thật</button></div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><strong>Lỗi kết nối Backend:</strong> {error}. Hãy kiểm tra PowerShell chạy FastAPI tại cổng 8000.</div>}

      <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Tổng quan chỉ số môi trường & thiết bị</h2><span className="text-[11px] text-stone-400">Tự cập nhật mỗi 1,5 giây</span></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Nhiệt độ" value={fmt(data?.temperature, 1)} unit="°C" foot="DHT11 · UNO D7" icon={Thermometer} />
        <Metric label="Độ ẩm không khí" value={fmt(data?.humidity, 1)} unit="%" foot="DHT11" icon={Droplets} accent="blue" />
        <Metric label="Độ ẩm đất" value={fmt(data?.soilRaw)} unit="ADC" foot={data?.soilStatus || "Chưa có dữ liệu"} icon={Sprout} accent="emerald" />
        <Metric label="Ánh sáng" value={fmt(data?.lightRaw)} unit="ADC" foot="LDR · UNO A1" icon={Sun} accent="amber" />
        <Metric label="Cảm biến mưa" value={fmt(data?.rainRaw)} unit="ADC" foot={data ? data.raining ? "Đang mưa" : "Không mưa" : "Chưa có dữ liệu"} icon={CloudRain} accent="blue" />
        <Metric label="Mực nước ngập" value={fmt(data?.floodRaw)} unit="ADC" foot={data ? data.ledRed ? "ĐANG CẢNH BÁO" : "Đang giám sát" : "Chưa có dữ liệu"} icon={Waves} accent={data?.ledRed ? "rose" : "blue"} />
        <Metric label="Khoảng cách xe" value={fmt(data?.distanceCm, 1)} unit="cm" foot={data ? data.carDetected ? "Có xe đỗ" : "Chỗ trống" : "Chưa có dữ liệu"} icon={CarFront} accent="amber" />
        <Metric label="Cảm biến rung" value={s(data?.vibration ? "Có rung" : "Bình thường")} foot="SW-420 · UNO D2" icon={ShieldAlert} accent={data?.vibration ? "rose" : "emerald"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Nhà màng & hệ thống tưới cây" note="Bơm 1 · UNO D3 · Giới hạn mỗi lần tưới 5 giây" icon={Sprout}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-stone-500">Chế độ</p><p className="mt-1 text-lg font-bold">{data?.waterMode || "--"}</p></div><div className="text-right"><p className="text-xs text-stone-500">Trạng thái bơm 1</p><StatusPill color={data?.pump1 ? "green" : "neutral"}>{data ? data.pump1 ? "ĐANG TƯỚI" : "ĐÃ TẮT" : "CHƯA CÓ DỮ LIỆU"}</StatusPill></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><ActionButton label="AUTO" onClick={() => void command("water/auto")} disabled={!canControl} busy={busy === "water/auto"} kind={data?.waterMode === "AUTO" ? "primary" : "plain"} /><ActionButton label="MANUAL" onClick={() => void command("water/manual")} disabled={!canControl} busy={busy === "water/manual"} kind={data?.waterMode === "MANUAL" ? "primary" : "plain"} /><ActionButton label="Bật tưới" onClick={() => void command("water/on")} disabled={!canControl || data?.waterMode !== "MANUAL"} busy={busy === "water/on"} /><ActionButton label="Tắt tưới" onClick={() => void command("water/off")} disabled={!canControl} busy={busy === "water/off"} kind="danger" /></div>
          <p className="mt-3 text-[11px] leading-5 text-stone-500">AUTO chỉ kích hoạt lại khi đất từng ẩm (RAW ≤650), sau đó khô (≥850), trời không mưa (mưa RAW ≥900). MANUAL cần chọn trước khi bật tưới.</p>
        </Panel>
        <Panel title="Cửa thông minh" note="ESP32 GPIO23 · Keypad 1234# · tự đóng sau 5 giây" icon={DoorOpen}>
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-stone-500">Trạng thái cửa</p><p className="mt-1 text-lg font-bold">{data ? data.doorOpen ? "ĐANG MỞ" : "ĐÃ ĐÓNG" : "--"}</p></div><StatusPill color={data?.doorOpen ? "yellow" : "green"}>{data ? data.doorOpen ? "Cửa đang mở" : "Cửa an toàn" : "Chưa có dữ liệu"}</StatusPill></div>
          <div className="mt-5 grid grid-cols-2 gap-2"><ActionButton label="Mở cửa" onClick={() => void command("door/open")} disabled={!canControl} busy={busy === "door/open"} /><ActionButton label="Đóng cửa" onClick={() => void command("door/close")} disabled={!canControl} busy={busy === "door/close"} kind="plain" /></div>
          <p className="mt-3 text-[11px] text-stone-500">Chỉ trạng thái sau phản hồi từ API được hiển thị. Không tự coi lệnh đã gửi là thiết bị đã thực hiện.</p>
        </Panel>
        <Panel title="Phát hiện mưa & chống ngập" note="Bơm 2 tự động · UNO D5 · Không cho bật cưỡng bức" icon={Waves}>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Mực nước RAW</p><p className="mt-2 text-xl font-bold">{fmt(data?.floodRaw)}</p><StatusPill color={data?.ledRed ? "red" : "green"}>{data ? data.ledRed ? "CẢNH BÁO NGẬP" : "Bình thường" : "Chưa có dữ liệu"}</StatusPill></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Bơm chống ngập</p><p className="mt-2 text-xl font-bold">{data?.pump2 === null || !data ? "--" : data.pump2 ? "ĐANG CHẠY" : "ĐÃ TẮT"}</p><p className="mt-2 text-[11px] text-stone-500">{mode === "live" ? "Firmware /data chưa trả trạng thái relay 2" : "Mô phỏng theo ngưỡng UNO"}</p></div></div>
          <p className="mt-3 text-[11px] leading-5 text-stone-500">Nước ≥700 liên tục 3 giây: bơm bật. ≤100 liên tục 3 giây: bơm dừng và tái kích hoạt. Tự ngắt sau tối đa 30 giây.</p>
        </Panel>
        <Panel title="Bãi đỗ xe tự động" note="HC-SR04 GPIO25/26 · NeoPixel GPIO27" icon={ParkingCircle}>
          <div className="flex items-center justify-between"><div><p className="text-xs text-stone-500">Khoảng cách đo</p><p className="mt-1 text-2xl font-bold">{fmt(data?.distanceCm, 1)} <span className="text-sm font-normal text-stone-500">cm</span></p></div><StatusPill color={data?.carDetected ? "red" : "green"}>{data ? data.carDetected ? "CÓ XE" : "CHỖ TRỐNG" : "Chưa có dữ liệu"}</StatusPill></div>
          <p className="mt-4 text-[11px] leading-5 text-stone-500">Có xe khi khoảng cách đo hợp lệ từ khoảng 2 cm tới 5,5 cm. NeoPixel đỏ khi có xe, xanh khi trống, vàng khi phép đo không hợp lệ.</p>
        </Panel>
        <Panel title="3 LED trạng thái thực tế" note="Suy luận theo logic UNO; không đo trực tiếp chân LED" icon={Lightbulb}>
          <div className="grid gap-2"><Lamp color="red" label="Đỏ · báo ngập D6" on={data ? data.ledRed : null} /><Lamp color="green" label="Xanh · an toàn D8" on={data ? data.ledGreen : null} /><Lamp color="yellow" label="Vàng · bơm 1 D9" on={data ? data.ledYellow : null} /></div>
          <p className="mt-3 text-[11px] text-stone-500">LED đỏ giữ cảnh báo sau khi nước giảm xuống giữa 100–699 cho tới khi mức nước thấp ổn định; trạng thái LED thật không có telemetry riêng.</p>
        </Panel>
        <Panel title="An ninh & kết nối hệ thống" note="Cảm biến SW-420 · Trạng thái kết nối UNO / ESP32" icon={ShieldAlert}>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Cảm biến rung</p><p className="mt-2 text-base font-bold">{data ? data.vibration ? "PHÁT HIỆN RUNG" : "Bình thường" : "--"}</p></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Arduino UNO</p><p className="mt-2 text-base font-bold">{data ? mode === "demo" ? "Mô phỏng" : data.unoConnected ? "Đã kết nối" : "Mất kết nối" : "--"}</p></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">ESP32</p><p className="mt-2 text-base font-bold">{mode === "demo" ? "Mô phỏng" : snapshot?.connected ? "Trực tuyến" : "Ngoại tuyến"}</p></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Máy chủ Dashboard</p><p className="mt-2 text-base font-bold">{error ? "Mất kết nối" : "Đã kết nối"}</p></div></div>
        </Panel>
      </div>

      {mode === "demo" && <Panel title="Phòng thử nghiệm mô phỏng – Không cần cắm mạch" icon={Gauge} note="Đặt giá trị cảm biến rồi nhấn Áp dụng để trình diễn các ngưỡng hoạt động.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([ ["floodRaw", "Mực nước RAW", 0, 1200, 25], ["soil", "Độ ẩm đất RAW", 0, 1023, 10], ["rain", "Cảm biến mưa RAW", 0, 1023, 10], ["distance", "Khoảng cách xe (cm)", 2, 40, 1] ] as const).map(([key,label,min,max,step]) => <label key={key} className="rounded-xl border border-stone-100 bg-stone-50 p-3"><span className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{label}</span><span className="text-emerald-700">{draft[key]}</span></span><input className="mt-4 w-full accent-emerald-700" type="range" min={min} max={max} step={step} value={draft[key]} onChange={e => setDraft(v => ({ ...v, [key]: Number(e.target.value) }))} /></label>)}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs font-semibold"><input type="checkbox" checked={draft.vibration} onChange={e => setDraft(v => ({...v, vibration:e.target.checked}))} /> Giả lập cảm biến rung SW-420</label>
        <div className="mt-4 flex flex-wrap gap-2"><ActionButton label="Áp dụng tình huống" onClick={() => void applySensors(draft)} disabled={!!busy} busy={busy === "sensors"} /><ActionButton label="Khôi phục cảm biến" onClick={() => { setDraft(DEFAULT_DRAFT); void applySensors(DEFAULT_DRAFT); }} disabled={!!busy} kind="plain" /></div>
        <p className="mt-3 text-[11px] text-stone-500">Ví dụ: ngập RAW=900 rồi đợi 3 giây → bơm 2 bật. Giảm về 500 → cảnh báo vẫn giữ. Giảm về 0 và đợi 3 giây → cảnh báo tắt. Ở chế độ mô phỏng tuyệt đối không phát lệnh ra thiết bị.</p>
      </Panel>}

      <Panel title="Biểu đồ cảm biến theo thời gian" icon={Activity} note="Dữ liệu cập nhật tự động từ Backend"><LineChart history={snapshot?.history || []} /></Panel>
      <div aria-live="polite" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600"><strong>Thông báo:</strong> {notice}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 py-4 text-[11px] text-stone-500"><span>Smart Eco Garden · Bản tích hợp Next.js & FastAPI · Demo phần mềm không cần phần cứng</span><div className="flex items-center gap-3"><a className="inline-flex items-center gap-1 text-emerald-800 underline" href={`${API_ROOT}/eco-demo`} target="_blank" rel="noreferrer">Bản demo dự phòng <ExternalLink className="h-3 w-3" /></a><span>Cảnh báo: chưa xác thực tích hợp phần cứng thật</span></div></footer>
    </main>
  </div>;
}
