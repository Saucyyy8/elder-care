import mediapipe as mp
import cv2
import numpy as np

class MockLandmark:
    def __init__(self):
        self.x = 0.5
        self.y = 0.5
        self.z = 0.5
        self.visibility = 0.9

latest_landmarks = [MockLandmark() for _ in range(33)]

cv_img = np.zeros((480, 640, 3), dtype=np.uint8)
h, w, _ = cv_img.shape
mp_pose = mp.solutions.pose

try:
    for connection in mp_pose.POSE_CONNECTIONS:
        start_idx, end_idx = connection
        if start_idx < len(latest_landmarks) and end_idx < len(latest_landmarks):
            start_lm = latest_landmarks[start_idx]
            end_lm = latest_landmarks[end_idx]
            if (getattr(start_lm, 'visibility', 0.0) or 0.0) > 0.5 and (getattr(end_lm, 'visibility', 0.0) or 0.0) > 0.5:
                s_point = (int(start_lm.x * w), int(start_lm.y * h))
                e_point = (int(end_lm.x * w), int(end_lm.y * h))
                cv2.line(cv_img, s_point, e_point, (255, 255, 255), 2)
    for lm in latest_landmarks:
        if (getattr(lm, 'visibility', 0.0) or 0.0) > 0.5:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(cv_img, (cx, cy), 4, (0, 255, 0), -1)
    print("DRAWING SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
