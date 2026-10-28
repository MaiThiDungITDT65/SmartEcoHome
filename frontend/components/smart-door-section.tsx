import React from "react";
import { SmartDoorInfo } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import { DoorClosed, DoorOpen, Lock, Compass, Clock, KeyRound } from "lucide-react";
import { formatBoolean, formatRawSensor, UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

interface SmartDoorSectionProps {
  data: SmartDoorInfo | null | undefined;
  isStale?: boolean;
}

export function SmartDoorSection({ data, isStale }: SmartDoorSectionProps) {
  const isOpen = data?.status?.toLowerCase() === "open";
  const isClosed = data?.status?.toLowerCase() === "closed";

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between ${isStale ? "opacity-90" : ""}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            {isOpen ? <DoorOpen className="w-5 h-5 text-amber-600" /> : <DoorClosed className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Cửa thông minh (Smart Door)
            </h2>
            <p className="text-xs text-slate-500">
              Trạng thái servo cổng, bảo mật bàn phím và tự động đóng
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
            variant={isOpen ? "warning" : isClosed ? "neutral" : "neutral"}
            label={isOpen ? "Đang mở" : isClosed ? "Đang đóng" : UNAVAILABLE_TEXT}
          />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Servo Angle */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Góc quay Servo</span>
              <Compass className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {formatRawSensor(data?.servo_angle)}
              </span>
              {data?.servo_angle !== null && data?.servo_angle !== undefined && (
                <span className="text-xs font-semibold text-slate-500 font-mono-data">°</span>
              )}
            </div>
          </div>

          {/* Keypad Status */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Bàn phím Keypad</span>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1">
              <StatusBadge
                variant={data?.keypad_enabled ? "success" : "neutral"}
                label={formatBoolean(data?.keypad_enabled, "Kích hoạt", "Đã khóa")}
                dot={false}
              />
            </div>
          </div>

          {/* Password Protection */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Yêu cầu mật khẩu</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1">
              <StatusBadge
                variant={data?.password_required ? "info" : "neutral"}
                label={formatBoolean(data?.password_required, "Bảo vệ mã số", "Không yêu cầu")}
                dot={false}
              />
            </div>
          </div>

          {/* Auto Close Timer */}
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Tự đóng sau</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-data text-slate-900">
                {formatRawSensor(data?.auto_close_seconds)}
              </span>
              {data?.auto_close_seconds !== null && data?.auto_close_seconds !== undefined && (
                <span className="text-xs font-semibold text-slate-500 font-mono-data">giây</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
