import React from "react";
import { ParkingInfo } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import { Car, Ruler, Lightbulb, Target } from "lucide-react";
import { formatBoolean, formatRawSensor, UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

interface ParkingSectionProps {
  data: ParkingInfo | null | undefined;
  isStale?: boolean;
}

export function ParkingSection({ data, isStale }: ParkingSectionProps) {
  const isVehiclePresent = data?.vehicle_detected === true;
  const neopixel = data?.neopixel;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between ${isStale ? "opacity-90" : ""}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Đỗ xe thông minh (Smart Parking)
            </h2>
            <p className="text-xs text-slate-500">
              Cảm biến siêu âm phát hiện vật cản & chỉ dẫn LED NeoPixel
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
              data?.vehicle_detected !== null && data?.vehicle_detected !== undefined
                ? isVehiclePresent
                  ? "danger"
                  : "success"
                : "neutral"
            }
            label={formatBoolean(data?.vehicle_detected, "Phát hiện xe", "Vị trí trống")}
          />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Distance */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Khoảng cách đo</span>
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {formatRawSensor(data?.distance_cm)}
              </span>
              {data?.distance_cm !== null && data?.distance_cm !== undefined && (
                <span className="text-xs font-semibold text-slate-500 font-mono-data">cm</span>
              )}
            </div>
          </div>

          {/* Detection Threshold */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Ngưỡng phát hiện</span>
              <Target className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {formatRawSensor(data?.detection_threshold_cm)}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono-data">cm</span>
            </div>
          </div>

          {/* NeoPixel LED Strip */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Dải LED NeoPixel</span>
              <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {neopixel?.count ?? UNAVAILABLE_TEXT}
              </span>
              <span className="text-xs font-semibold text-slate-500">hạt LED</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Số lượng hạt LED chỉ thị</span>
          </div>

          {/* NeoPixel Status / Brightness */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Độ sáng / Màu</span>
              <span className="text-[10px] font-mono-data text-slate-400">
                {neopixel?.brightness !== undefined ? `Mức ${neopixel.brightness}` : ""}
              </span>
            </div>
            <div className="mt-1">
              {neopixel?.status ? (
                <StatusBadge
                  variant={
                    neopixel.status.toLowerCase().includes("red")
                      ? "danger"
                      : neopixel.status.toLowerCase().includes("green")
                      ? "success"
                      : "neutral"
                  }
                  label={neopixel.status}
                  dot={true}
                />
              ) : (
                <span className="text-xs text-slate-400">{UNAVAILABLE_TEXT}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
