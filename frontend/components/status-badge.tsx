import React from "react";
import { LucideIcon } from "lucide-react";

export type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
  // success → xanh lá (emerald) — cây xanh, bơm chạy, ESP32 online
  success: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  // warning → vàng nắng (amber) — cảnh báo nhẹ, dữ liệu cũ
  warning: {
    bg: "bg-amber-50 text-amber-800 border-amber-200/80",
    dot: "bg-amber-500",
  },
  // danger → đỏ-nâu (rose) — báo động, xe đỗ, mất kết nối
  danger: {
    bg: "bg-rose-50 text-rose-800 border-rose-200/80",
    dot: "bg-rose-500",
  },
  // neutral → xám mây (stone) — trạng thái nghỉ, không xác định
  neutral: {
    bg: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
  },
  // info → xanh dương — thông tin, trời mưa, đất ẩm
  info: {
    bg: "bg-sky-50 text-sky-800 border-sky-200/80",
    dot: "bg-sky-500",
  },
};

export function StatusBadge({
  variant,
  label,
  dot = true,
  icon: Icon,
  className = "",
}: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.bg} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
