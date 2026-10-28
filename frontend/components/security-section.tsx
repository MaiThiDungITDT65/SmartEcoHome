import React from "react";
import { SecurityInfo } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import { Shield, Bell, BellOff, Vibrate } from "lucide-react";
import { formatBoolean } from "@/lib/dashboard-utils";

interface SecuritySectionProps {
  data: SecurityInfo | null | undefined;
  isStale?: boolean;
}

export function SecuritySection({ data, isStale }: SecuritySectionProps) {
  const isVibrationDetected = data?.vibration_detected === true;
  const isAlarmTriggered = data?.alarm === true;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between ${isStale ? "opacity-90" : ""}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              An ninh & Cảnh báo (Security)
            </h2>
            <p className="text-xs text-slate-500">
              Cảm biến rung chấn đột nhập và còi báo động bảo vệ khu vườn
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
            variant={isAlarmTriggered ? "danger" : isVibrationDetected ? "warning" : "success"}
            label={
              isAlarmTriggered
                ? "Báo động kích hoạt!"
                : isVibrationDetected
                ? "Phát hiện rung"
                : "An toàn"
            }
          />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Vibration Sensor */}
          <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isVibrationDetected ? "bg-amber-100 text-amber-800" : "bg-slate-200/60 text-slate-600"}`}>
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Cảm biến rung chấn
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatBoolean(data?.vibration_detected, "Phát hiện rung lắc!", "Bình thường")}
                </span>
              </div>
            </div>
            <StatusBadge
              variant={isVibrationDetected ? "warning" : "neutral"}
              label={data?.vibration_detected !== null && data?.vibration_detected !== undefined ? (isVibrationDetected ? "Rung chấn" : "Yên tĩnh") : "Chưa có dữ liệu"}
              dot={false}
            />
          </div>

          {/* Alarm Siren */}
          <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isAlarmTriggered ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-slate-200/60 text-slate-600"}`}>
                {isAlarmTriggered ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Còi báo động (Alarm)
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatBoolean(data?.alarm, "Đang hú còi!", "Đang tắt")}
                </span>
              </div>
            </div>
            <StatusBadge
              variant={isAlarmTriggered ? "danger" : "neutral"}
              label={data?.alarm !== null && data?.alarm !== undefined ? (isAlarmTriggered ? "Hú còi" : "Tắt") : "Chưa có dữ liệu"}
              dot={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
