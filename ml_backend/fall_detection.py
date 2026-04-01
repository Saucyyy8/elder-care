import cv2
import numpy as np
import time
import requests
import tensorflow as tf


VIDEO_PATH = "fall2.mp4"

TELEGRAM_TOKEN = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg"
CHAT_ID = "8507257605"

ALERT_COOLDOWN = 10 


def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = {
            "chat_id": CHAT_ID,
            "text": msg
        }
        requests.post(url, data=data, timeout=3)
    except Exception as e:
        print("Telegram error:", e)



interpreter = tf.lite.Interpreter(model_path="movenet.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def detect_pose(frame):
    img = cv2.resize(frame, (192, 192))
    img = np.expand_dims(img, axis=0).astype(np.float32)

    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()

    keypoints = interpreter.get_tensor(output_details[0]['index'])
    return keypoints


fall_counter = 0
last_alert_time = 0

def detect_fall(keypoints):
    global fall_counter, last_alert_time

    kp = keypoints[0][0]


    shoulder_y = (kp[5][0] + kp[6][0]) / 2
    hip_y = (kp[11][0] + kp[12][0]) / 2

    vertical_diff = abs(shoulder_y - hip_y)


    if vertical_diff < 0.05:
        fall_counter += 1
    else:
        fall_counter = 0


    if fall_counter > 8:
        if time.time() - last_alert_time > ALERT_COOLDOWN:
            last_alert_time = time.time()
            return True

    return False


DISPLAY_WIDTH = 480   
DISPLAY_HEIGHT = 800  


cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("Error: Could not open video")
    exit()

print("Running fall detection on video...")

while True:
    ret, frame = cap.read()


    if not ret:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    
    h, w, _ = frame.shape

    scale = min(DISPLAY_WIDTH / w, DISPLAY_HEIGHT / h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    resized = cv2.resize(frame, (new_w, new_h))


    canvas = np.zeros((DISPLAY_HEIGHT, DISPLAY_WIDTH, 3), dtype=np.uint8)


    y_offset = (DISPLAY_HEIGHT - new_h) // 2
    x_offset = (DISPLAY_WIDTH - new_w) // 2

    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized


    keypoints = detect_pose(frame)
    fall = detect_fall(keypoints)

    if fall:
        print("🚨 FALL DETECTED")
        send_telegram("🚨 Fall detected (video demo)")

    status_text = "FALL DETECTED" if fall else "Normal"
    color = (0, 0, 255) if fall else (0, 255, 0)

    cv2.putText(canvas, status_text, (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("Fall Detection (Video)", canvas)

    if cv2.waitKey(30) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
