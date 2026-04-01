from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import time

app = FastAPI()


class SensorData(BaseModel):
    accel: float
    rssi: dict
    timestamp: float


class FallDetector:
    def __init__(self):
        self.impact_threshold = 25
        self.inactivity_threshold = 2
        self.last_impact_time = None

    def process(self, accel):
        now = time.time()

        if accel > self.impact_threshold:
            self.last_impact_time = now
            print("Impact detected")

        if self.last_impact_time:
            if accel < 2:
                if now - self.last_impact_time > self.inactivity_threshold:
                    return True
        return False

fall_detector = FallDetector()


@app.post("/sensor")
async def receive_data(data: SensorData):
    print("\n--- Incoming Data ---")
    print(f"Accel: {data.accel:.2f}")
    print(f"RSSI AP count: {len(data.rssi)}")

    fall = fall_detector.process(data.accel)

    if fall:
        print("ALERT: FALL DETECTED")

    return {"status": "ok", "fall": fall}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)