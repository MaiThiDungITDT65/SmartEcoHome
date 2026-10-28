import React from "react";
import { ProjectInfo, SystemInfo } from "@/types/smart-garden";
import { Cpu, Wifi, Zap, Network, Terminal } from "lucide-react";
import { formatRawSensor, UNAVAILABLE_TEXT } from "@/lib/dashboard-utils";

interface SystemMetadataSectionProps {
  project: ProjectInfo | null | undefined;
  system: SystemInfo | null | undefined;
}

export function SystemMetadataSection({ project, system }: SystemMetadataSectionProps) {
  return (
    <div className="bg-slate-900 text-slate-300 rounded-xl p-5 border border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Thông số phần cứng & Kết nối Gateway
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Dự án:</span>
          <span className="font-semibold text-emerald-300">
            {project?.name || "Smart Eco Garden"} {project?.version ? `v${project.version}` : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 text-xs">
        {/* Gateway MCU */}
        <div>
          <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Gateway Wi-Fi
          </span>
          <span className="font-mono-data font-semibold text-white">
            {project?.controller || "ESP32"}
          </span>
        </div>

        {/* Sensor Controller */}
        <div>
          <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Sensor Controller
          </span>
          <span className="font-mono-data font-semibold text-white">
            {project?.sensor_controller || "Arduino UNO"}
          </span>
        </div>

        {/* WiFi SSID */}
        <div>
          <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            Wi-Fi SSID
          </span>
          <span className="font-mono-data font-semibold text-white truncate block">
            {project?.wifi_ssid || UNAVAILABLE_TEXT}
          </span>
        </div>

        {/* Local IP */}
        <div>
          <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-slate-400" />
            Địa chỉ IP
          </span>
          <span className="font-mono-data font-semibold text-emerald-400">
            {project?.local_ip || UNAVAILABLE_TEXT}
          </span>
        </div>

        {/* Power Voltage */}
        <div>
          <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            Điện áp nguồn
          </span>
          <span className="font-mono-data font-semibold text-white">
            {formatRawSensor(system?.power_voltage, system?.power_unit || "V")}
          </span>
        </div>
      </div>
    </div>
  );
}
