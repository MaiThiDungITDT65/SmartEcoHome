import React from "react";
import { ConnectionState } from "@/types/smart-garden";
import { StatusBadge } from "./status-badge";
import { Wifi, Activity, ServerOff } from "lucide-react";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  deviceOnline: boolean;
  hasTelemetry: boolean;
  isBackendReachable: boolean;
  isStale: boolean;
}

export function ConnectionStatus({
  connectionState,
  deviceOnline,
  hasTelemetry,
  isBackendReachable,
  isStale,
}: ConnectionStatusProps) {
  // 1. WebSocket Stream Status
  const getWsBadge = () => {
    switch (connectionState) {
      case "connected":
        return <StatusBadge variant="success" label="WebSocket Live" icon={Wifi} />;
      case "reconnecting":
        return <StatusBadge variant="warning" label="Đang kết nối lại WS..." icon={Wifi} />;
      case "connecting":
        return <StatusBadge variant="warning" label="Đang kết nối WS..." icon={Wifi} />;
      case "disconnected":
      default:
        return <StatusBadge variant="danger" label="Mất kết nối WS" icon={ServerOff} />;
    }
  };

  // 2. Hardware / ESP32 Online Status
  const getDeviceBadge = () => {
    if (!isBackendReachable) {
      return <StatusBadge variant="danger" label="Backend không khả dụng" icon={ServerOff} />;
    }
    if (!hasTelemetry) {
      return <StatusBadge variant="neutral" label="Chờ ESP32 gửi dữ liệu" icon={Activity} />;
    }
    if (deviceOnline) {
      if (isStale) {
        return <StatusBadge variant="warning" label="ESP32 Cũ (>30s)" icon={Activity} />;
      }
      return <StatusBadge variant="success" label="ESP32 Online" icon={Activity} />;
    }
    return <StatusBadge variant="danger" label="ESP32 Offline" icon={Activity} />;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {getWsBadge()}
      {getDeviceBadge()}
    </div>
  );
}
