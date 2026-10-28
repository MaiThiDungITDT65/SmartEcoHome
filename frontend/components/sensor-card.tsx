import React from "react";
import { LucideIcon } from "lucide-react";
import { StatusBadge, BadgeVariant } from "./status-badge";
import { UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

/** Nature color themes for sensor icons */
export type SensorColorTheme =
  | "green"   // xanh lá — nhiệt độ, cây cỏ, tưới tiêu
  | "blue"    // xanh dương — độ ẩm, mưa, kết nối
  | "earth"   // nâu đất — đất, cảm biến đất
  | "sun"     // vàng nắng — ánh sáng, điện áp
  | "cloud";  // xám mây — trung tính, khoảng cách, đỗ xe

const themeStyles: Record<SensorColorTheme, { icon: string }> = {
  green: { icon: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" },
  blue:  { icon: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  earth: { icon: "bg-orange-50 text-orange-800 ring-1 ring-orange-100" },
  sun:   { icon: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  cloud: { icon: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
};

interface SensorCardProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  statusText?: string | null;
  statusVariant?: BadgeVariant;
  icon: LucideIcon;
  description?: string;
  isRaw?: boolean;
  isStale?: boolean;
  colorTheme?: SensorColorTheme;
  className?: string;
}

export function SensorCard({
  title,
  value,
  unit,
  statusText,
  statusVariant = "neutral",
  icon: Icon,
  description,
  isRaw = false,
  isStale = false,
  colorTheme = "green",
  className = "",
}: SensorCardProps) {
  const isAvailable = value !== null && value !== undefined;
  const { icon: iconCls } = themeStyles[colorTheme];

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md relative flex min-h-[190px] flex-col justify-between text-center ${className}`}
    >
      <div>
        <div className="flex flex-col items-center gap-3 mb-3">
          <div className={`p-3 rounded-xl ${iconCls}`}>
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className="text-xs font-bold text-stone-600 uppercase tracking-[0.12em] leading-tight">
            {title}
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-1 mt-1">
          {isAvailable ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold font-mono-data text-emerald-950 tracking-tight">
                {value}
              </span>
              {unit && (
                <span className="text-sm font-bold text-stone-500 font-mono-data">
                  {unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-base font-medium text-stone-400 italic">
              {UNAVAILABLE_TEXT}
            </span>
          )}
        </div>

        {isRaw && (
          <p className="text-[11px] font-mono-data text-stone-500 mt-2">
            Tín hiệu ADC thô (không quy đổi %)
          </p>
        )}

        {description && !isRaw && (
          <p className="text-xs text-stone-500 mt-2">{description}</p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-center text-xs">
        {statusText ? (
          <StatusBadge variant={statusVariant} label={statusText} />
        ) : (
          <span className="text-[11px] text-stone-400">Trạng thái: Tự động</span>
        )}

        {isStale && isAvailable && (
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
            Cũ
          </span>
        )}
      </div>
    </div>
  );
}
