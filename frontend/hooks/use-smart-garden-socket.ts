"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ConnectionState, TelemetryState, WebSocketMessage } from "@/types/smart-garden";
import { fetchCurrentStatus } from "@/lib/api";
import { isDataStale } from "@/lib/dashboard-utils";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/status";
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;
const BACKOFF_MULTIPLIER = 1.8;

export interface SmartGardenSocketHook {
  state: TelemetryState | null;
  hasTelemetry: boolean;
  deviceOnline: boolean;
  lastSeen: string | null;
  connectionState: ConnectionState;
  isBackendReachable: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSmartGardenSocket(): SmartGardenSocketHook {
  const [state, setState] = useState<TelemetryState | null>(null);
  const [hasTelemetry, setHasTelemetry] = useState<boolean>(false);
  const [deviceOnline, setDeviceOnline] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [isBackendReachable, setIsBackendReachable] = useState<boolean>(true);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // References for lifecycle and race condition management
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const lastStateTimestampRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const lastSeenRef = useRef<string | null>(null);

  // Synchronize ref with state
  useEffect(() => {
    lastSeenRef.current = lastSeen;
  }, [lastSeen]);

  // Safe state updater preventing out-of-order stale HTTP writes
  const applyStateUpdate = useCallback((
    newState: TelemetryState | null,
    newOnline: boolean,
    newHasTelemetry: boolean,
    newLastSeen: string | null,
    sourceTimestamp: number
  ) => {
    if (isUnmountedRef.current) return;

    if (sourceTimestamp >= lastStateTimestampRef.current) {
      lastStateTimestampRef.current = sourceTimestamp;
      setState(newState);
      setDeviceOnline(newOnline);
      setHasTelemetry(newHasTelemetry);
      setLastSeen(newLastSeen);
      lastSeenRef.current = newLastSeen;
      setIsStale(isDataStale(newLastSeen));
      setError(null);
    }
  }, []);

  // Manual snapshot refresh over HTTP
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const snapshot = await fetchCurrentStatus();
      setIsBackendReachable(true);

      const timestamp = snapshot.last_seen ? new Date(snapshot.last_seen).getTime() : Date.now();
      applyStateUpdate(
        snapshot.state,
        snapshot.online,
        snapshot.has_telemetry,
        snapshot.last_seen,
        timestamp
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể kết nối đến backend";
      setError(msg);
      setIsBackendReachable(false);
    }
  }, [applyStateUpdate]);

  // WebSocket Connection Logic
  useEffect(() => {
    isUnmountedRef.current = false;
    let isCancelled = false;

    // 1. Initial snapshot hydration via HTTP (asynchronous promise callback)
    fetchCurrentStatus()
      .then((snapshot) => {
        if (!isCancelled && !isUnmountedRef.current) {
          setIsBackendReachable(true);
          const timestamp = snapshot.last_seen ? new Date(snapshot.last_seen).getTime() : Date.now();
          applyStateUpdate(
            snapshot.state,
            snapshot.online,
            snapshot.has_telemetry,
            snapshot.last_seen,
            timestamp
          );
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled && !isUnmountedRef.current) {
          setIsBackendReachable(false);
          setError(err instanceof Error ? err.message : "Lỗi kết nối backend");
        }
      });

    // 2. Connect to WebSocket
    const connectWebSocket = () => {
      if (isUnmountedRef.current) return;

      // Clean up previous socket if existing
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }

      setConnectionState((prev) => (prev === "connected" ? "reconnecting" : "connecting"));

      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmountedRef.current) {
            ws.close();
            return;
          }
          setConnectionState("connected");
          setIsBackendReachable(true);
          backoffRef.current = INITIAL_BACKOFF_MS; // Reset backoff on success
          setError(null);
        };

        ws.onmessage = (event) => {
          if (isUnmountedRef.current) return;
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            if (!data.event) return;

            const timestamp = data.last_seen ? new Date(data.last_seen).getTime() : Date.now();
            applyStateUpdate(
              data.state,
              data.online,
              data.has_telemetry,
              data.last_seen,
              timestamp
            );
          } catch (e) {
            console.warn("Invalid WebSocket JSON received:", e);
            setError("Gói tin telemetry không hợp lệ từ máy chủ");
          }
        };

        ws.onclose = () => {
          if (isUnmountedRef.current) return;

          setConnectionState("reconnecting");
          socketRef.current = null;

          // Schedule reconnection with bounded exponential backoff
          const delay = Math.min(
            backoffRef.current + Math.floor(Math.random() * 500),
            MAX_BACKOFF_MS
          );
          backoffRef.current = Math.min(backoffRef.current * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              connectWebSocket();
            }
          }, delay);
        };

        ws.onerror = () => {
          if (isUnmountedRef.current) return;
          setIsBackendReachable(false);
          // onclose handles reconnect logic
        };
      } catch {
        if (isUnmountedRef.current) return;
        setConnectionState("disconnected");
        setIsBackendReachable(false);
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      }
    };

    connectWebSocket();

    // Periodic stale checker (runs every 5 seconds)
    const staleInterval = setInterval(() => {
      if (!isUnmountedRef.current && lastSeenRef.current) {
        setIsStale(isDataStale(lastSeenRef.current));
      }
    }, 5000);

    return () => {
      isCancelled = true;
      isUnmountedRef.current = true;
      clearInterval(staleInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [applyStateUpdate]);

  return {
    state,
    hasTelemetry,
    deviceOnline,
    lastSeen,
    connectionState,
    isBackendReachable,
    isStale,
    error,
    refresh,
  };
}
