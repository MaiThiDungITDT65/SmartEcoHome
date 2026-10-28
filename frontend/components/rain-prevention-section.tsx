import React from "react";
import { FloodPreventionInfo } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import { CloudRain, CloudOff, Info, Zap, Settings } from "lucide-react";
import { formatBoolean, formatRawSensor, UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

interface RainPreventionSectionProps {
  data: FloodPreventionInfo | null | undefined;
  isStale?: boolean;
}

export function RainPreventionSection({ data, isStale }: RainPreventionSectionProps) {
  const isRaining = data?.is_raining === true;
  const isPumpOn = data?.pump === "on";
  const isRelayActive = data?.relay === true;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between ${isStale ? "opacity-90" : ""}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            {isRaining ? (
              <CloudRain className="w-5 h-5 text-sky-600" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Phát hiện mưa & Bơm thoát nước
            </h2>
            <p className="text-xs text-slate-500">
              Cảm biến nước mưa & cơ chế kích hoạt bơm bảo vệ ngập úng
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStale && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Cũ
            </span>
          )}
          <StatusBadge
            variant={
              data?.is_raining !== null && data?.is_raining !== undefined
                ? isRaining
                  ? "info"
                  : "neutral"
                : "neutral"
            }
            label={formatBoolean(data?.is_raining, "Trời đang mưa", "Trời tạnh ráo")}
          />
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Rain Sensor Raw */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Cảm biến mưa (Raw)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {formatRawSensor(data?.rain_sensor_raw)}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">ADC</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Tín hiệu analog thô</span>
          </div>

          {/* Drainage Pump */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Bơm thoát nước
            </span>
            <div className="mt-1">
              <StatusBadge
                variant={isPumpOn ? "success" : "neutral"}
                label={isPumpOn ? "Đang bật (On)" : "Đang tắt (Off)"}
              />
            </div>
          </div>

          {/* Relay */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Rơ-le bơm xả
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Zap className={`w-3.5 h-3.5 ${isRelayActive ? "text-amber-500" : "text-slate-400"}`} />
              <span className="text-xs font-semibold text-slate-700">
                {isRelayActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Mode & Implementation */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Chế độ / Tiến độ
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700 capitalize">
                {data?.mode || UNAVAILABLE_TEXT}
              </span>
              {data?.implementation_status && (
                <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1 py-0.5 rounded ml-1">
                  {data.implementation_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deferred Water Level Notice */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Ghi chú kỹ thuật:</strong> Tính năng đo mực nước bồn chứa (Water Tank Level) hiện đang được trì hoãn theo đặc tả dự án và sẽ được kích hoạt khi phần cứng cảm biến được gắn vào firmware.
          </p>
        </div>
      </div>
    </div>
  );
}
