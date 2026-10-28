/**
 * Formatting and status calculation utilities for Smart Eco Garden telemetry.
 * Strictly preserves 0 and false values, never treats raw values as percentages.
 */

export const UNAVAILABLE_TEXT = "Chưa có dữ liệu";

/**
 * Formats ISO timestamp into viewer's local timezone.
 */
export function formatLocalTimestamp(isoString: string | null | undefined): string {
  if (!isoString) {
    return UNAVAILABLE_TEXT;
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return UNAVAILABLE_TEXT;
    }
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    }).format(date);
  } catch {
    return UNAVAILABLE_TEXT;
  }
}

/**
 * Checks if telemetry data has exceeded timeout window (considered stale).
 */
export function isDataStale(lastSeenIso: string | null | undefined, timeoutSeconds = 30): boolean {
  if (!lastSeenIso) return true;
  try {
    const lastSeenTime = new Date(lastSeenIso).getTime();
    if (isNaN(lastSeenTime)) return true;
    return Date.now() - lastSeenTime > timeoutSeconds * 1000;
  } catch {
    return true;
  }
}

/**
 * Formats raw sensor values without inventing percentages or lux conversions.
 * Properly handles 0 (zero is valid, not null).
 */
export function formatRawSensor(
  value: number | null | undefined,
  unit?: string
): string {
  if (value === null || value === undefined) {
    return UNAVAILABLE_TEXT;
  }
  return unit ? `${value} ${unit}` : `${value}`;
}

/**
 * Formats boolean flags into clear semantic Vietnamese labels.
 * Properly distinguishes true vs false vs null/undefined.
 */
export function formatBoolean(
  value: boolean | null | undefined,
  trueLabel: string,
  falseLabel: string
): string {
  if (value === null || value === undefined) {
    return UNAVAILABLE_TEXT;
  }
  return value ? trueLabel : falseLabel;
}

/**
 * Returns human-readable relative time string (e.g. "5 giây trước").
 */
export function getRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return UNAVAILABLE_TEXT;
  try {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSeconds < 5) return "Vừa xong";
    if (diffSeconds < 60) return `${diffSeconds}s trước`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h trước`;
  } catch {
    return UNAVAILABLE_TEXT;
  }
}
