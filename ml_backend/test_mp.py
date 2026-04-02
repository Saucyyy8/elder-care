import mediapipe as mp
import time

latest_landmarks = None

def update_result(result, output_image, timestamp_ms):
    global latest_landmarks
    if result.pose_landmarks:
        latest_landmarks = result.pose_landmarks[0]
        # Just check visibility safely
        vis = getattr(latest_landmarks[0], 'visibility', 'MISSING')
        print("Visibility attribute:", vis)

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='/home/klepto/rssi/elder-care/ml_backend/pose_landmarker.task'),
    running_mode=VisionRunningMode.LIVE_STREAM,
    result_callback=update_result
)

import cv2
with PoseLandmarker.create_from_options(options) as landmarker:
    cap = cv2.VideoCapture(0)
    for _ in range(5):
        success, frame = cap.read()
        if not success: continue
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        try:
            landmarker.detect_async(mp_image, int(time.time() * 1000))
        except Exception as e:
            print("Detect Error", e)
        time.sleep(0.1)
        
        if latest_landmarks:
            print("Got landmarks! Trying to loop mp.solutions.pose.POSE_CONNECTIONS")
            try:
                conns = mp.solutions.pose.POSE_CONNECTIONS
                print("Connections type:", type(conns), list(conns)[0])
            except Exception as e:
                print("Connection error!", e)
