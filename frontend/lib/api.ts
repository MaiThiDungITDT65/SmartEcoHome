import { StatusResponse } from "@/types/smart-garden";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Fetches the current telemetry snapshot and connection state from FastAPI backend.
 */
export async function fetchCurrentStatus(): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
    // Avoid Next.js aggressive caching for live IoT state
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Verifies service health of FastAPI backend.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
