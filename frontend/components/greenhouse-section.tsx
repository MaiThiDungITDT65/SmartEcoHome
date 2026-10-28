import React from "react";
import { GreenhouseInfo } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import {
  Thermometer,
  Droplets,
  Sun,
  Sprout,
  Activity,
  ShieldAlert,
  Clock,
  Zap,
} from "lucide-react";
import { formatRawSensor, UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

interface GreenhouseSectionProps {
  data: GreenhouseInfo | null | undefined;
  isStale?: boolean;
}

export function GreenhouseSection({ data, isStale }: GreenhouseSectionProps) {
  const irrigation = data?.irrigation;
  const isPumpOn = irrigation?.pump === "on";
  const isRelayActive = irrigation?.relay === true;
  const isRainLocked = irrigation?.rain_lock === true;

  return (
    <div className={`bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden transition-opacity ${isStale ? "opacity-90" : ""}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Nhà màng & Hệ thống tưới cây
            </h2>
            <p className="text-xs text-stone-500">
              Giám sát vi khí hậu, độ ẩm đất và chu kỳ tưới tự động
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStale && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Dữ liệu cũ
            </span>
          )}
          <span className="text-xs font-mono-data text-stone-400 bg-stone-50 px-2 py-1 rounded border border-stone-100">
            Arduino UNO
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Environmental Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Temperature — xanh lá */}
          <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-100">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Nhiệt độ không khí</span>
              <Thermometer className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-stone-900">
                {formatRawSensor(data?.temperature)}
              </span>
              {data?.temperature !== null && data?.temperature !== undefined && (
                <span className="text-xs font-semibold text-stone-500">
                  °{data?.temperature_unit || "C"}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 block mt-1">Cảm biến DHT11/22</span>
          </div>

          {/* Humidity — xanh nước teal */}
          <div className="bg-teal-50/60 rounded-lg p-3.5 border border-teal-100">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Độ ẩm không khí</span>
              <Droplets className="w-4 h-4 text-teal-700" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-stone-900">
                {formatRawSensor(data?.humidity)}
              </span>
              {data?.humidity !== null && data?.humidity !== undefined && (
                <span className="text-xs font-semibold text-stone-500">
                  {data?.humidity_unit || "%"}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 block mt-1">Độ ẩm tương đối</span>
          </div>

          {/* Soil Moisture — nâu đất stone */}
          <div className="bg-stone-100/70 rounded-lg p-3.5 border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Độ ẩm đất (Raw)</span>
              <Sprout className="w-4 h-4 text-stone-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-stone-900">
                {formatRawSensor(data?.soil_moisture_raw)}
              </span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase">ADC</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Trạng thái:</span>
              {data?.soil_status ? (
                <StatusBadge
                  variant={
                    data.soil_status.toLowerCase() === "wet"
                      ? "info"
                      : data.soil_status.toLowerCase() === "moist"
                      ? "success"
                      : "warning"
                  }
                  label={data.soil_status}
                  dot={false}
                />
              ) : (
                <span className="text-xs text-stone-400">{UNAVAILABLE_TEXT}</span>
              )}
            </div>
          </div>

          {/* Light — vàng nắng amber */}
          <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-100">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Cường độ ánh sáng (Raw)</span>
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-stone-900">
                {formatRawSensor(data?.light_raw)}
              </span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase">ADC</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Trạng thái:</span>
              {data?.light_status ? (
                <StatusBadge
                  variant={
                    data.light_status.toLowerCase() === "bright"
                      ? "success"
                      : data.light_status.toLowerCase() === "dim"
                      ? "warning"
                      : "neutral"
                  }
                  label={data.light_status}
                  dot={false}
                />
              ) : (
                <span className="text-xs text-stone-400">{UNAVAILABLE_TEXT}</span>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only Irrigation Subsystem Status */}
        <div className="bg-emerald-900/5 rounded-xl p-4 border border-emerald-800/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-semibold text-stone-900">
                Hệ thống bơm tưới tự động (Firmware Telemetry)
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
              Chế độ giám sát (Read-only)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Mode */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">
                Chế độ vận hành
              </span>
              <span className="text-sm font-bold uppercase text-stone-800">
                {irrigation?.mode || UNAVAILABLE_TEXT}
              </span>
            </div>

            {/* Pump State */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">
                Máy bơm nước
              </span>
              <StatusBadge
                variant={isPumpOn ? "success" : "neutral"}
                label={isPumpOn ? "Đang bật" : "Đang tắt"}
              />
            </div>

            {/* Relay */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">
                Rơ-le kích hoạt
              </span>
              <div className="flex items-center gap-1">
                <Zap className={`w-3.5 h-3.5 ${isRelayActive ? "text-amber-500" : "text-stone-400"}`} />
                <span className="text-xs font-semibold text-stone-700">
                  {isRelayActive ? "Đóng (Active)" : "Ngắt (Open)"}
                </span>
              </div>
            </div>

            {/* Rain Lock */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">
                Khóa trời mưa
              </span>
              <div className="flex items-center gap-1">
                <ShieldAlert className={`w-3.5 h-3.5 ${isRainLocked ? "text-amber-600" : "text-teal-600"}`} />
                <span className="text-xs font-semibold text-stone-700">
                  {isRainLocked ? "Kích hoạt khóa" : "Bình thường"}
                </span>
              </div>
            </div>

            {/* Max Duration */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">
                Thời gian bơm tối đa
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-bold font-mono-data text-stone-800">
                  {irrigation?.max_run_seconds !== undefined
                    ? `${irrigation.max_run_seconds} giây`
                    : UNAVAILABLE_TEXT}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
