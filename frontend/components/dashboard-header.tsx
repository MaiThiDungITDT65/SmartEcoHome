"use client";

import React, { useState } from "react";
import { Sprout, RefreshCw, Clock } from "lucide-react";
import { ConnectionStatus } from "./connection-status";
import { ConnectionState } from "@/types/smart-garden";
import { formatLocalTimestamp, getRelativeTime } from "@/lib/dashboard-utils";

interface DashboardHeaderProps {
  connectionState: ConnectionState;
  deviceOnline: boolean;
  hasTelemetry: boolean;
  isBackendReachable: boolean;
  isStale: boolean;
  lastSeen: string | null;
  onRefresh: () => Promise<void>;
}

export function DashboardHeader({
  connectionState,
  deviceOnline,
  hasTelemetry,
  isBackendReachable,
  isStale,
  lastSeen,
  onRefresh,
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-xs border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-emerald-300 shadow-xs">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-stone-900">
                Smart Eco Garden
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                IoT Telemetry
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Bảng điều khiển giám sát nông nghiệp thông minh thời gian thực
            </p>
          </div>
        </div>

        {/* Status indicators & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <ConnectionStatus
            connectionState={connectionState}
            deviceOnline={deviceOnline}
            hasTelemetry={hasTelemetry}
            isBackendReachable={isBackendReachable}
            isStale={isStale}
          />

          {/* Last Seen indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Cập nhật:</span>
            <span className="font-mono-data font-medium text-stone-700">
              {formatLocalTimestamp(lastSeen)}
            </span>
            {lastSeen && (
              <span className="text-[11px] text-stone-400">
                ({getRelativeTime(lastSeen)})
              </span>
            )}
          </div>

          {/* Manual Snapshot Refresh button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Làm mới snapshot dữ liệu từ HTTP API"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-stone-500 ${isRefreshing ? "animate-spin text-teal-600" : ""}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>
    </header>
  );
}
