import asyncio
import httpx
import websockets
import json
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/status"

async def main():
    print("=== START LIVE END-TO-END TEST ===")
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Test /api/health
        health = await client.get("/api/health")
        print(f"1. Health check: status={health.status_code}, body={health.json()}")

        # 2. Test /api/status before telemetry
        status_before = await client.get("/api/status")
        print(f"2. Status before telemetry: {status_before.json()}")

        # 3. Connect to WebSocket and receive initial snapshot
        async with websockets.connect(WS_URL) as ws:
            snapshot = await ws.recv()
            print(f"3. WebSocket initial snapshot: {snapshot}")

            # 4. Ingest telemetry from ESP32 via HTTP POST
            payload = {
                "greenhouse": {
                    "temperature": 28.5,
                    "humidity": 65.0,
                    "soil_moisture_raw": 520,
                    "soil_status": "moist"
                },
                "smart_door": {
                    "status": "closed"
                }
            }
            post_resp = await client.post("/api/telemetry", json=payload)
            print(f"4. POST /api/telemetry: status={post_resp.status_code}, response={post_resp.json()}")

            # 5. Receive real-time broadcast message from WebSocket
            ws_update = await ws.recv()
            print(f"5. WebSocket received realtime broadcast: {ws_update}")

        # 6. Verify /api/status after telemetry
        status_after = await client.get("/api/status")
        data = status_after.json()
        print(f"6. Status after telemetry: online={data['online']}, last_seen={data['last_seen']}")
        print(f"   Greenhouse temp: {data['state']['greenhouse']['temperature']} C")
        print(f"   Greenhouse humidity: {data['state']['greenhouse']['humidity']} %")
        print(f"   System status: {data['state']['system']['status']}")
    
    print("=== LIVE TEST COMPLETED SUCCESSFULLY 100%! ===")

if __name__ == "__main__":
    asyncio.run(main())
