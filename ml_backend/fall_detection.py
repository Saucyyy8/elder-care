import cv2
import numpy as np
import time
import requests
import os

try:
    from tflite_runtime.interpreter import Interpreter
except Exception:
    try:
        from tensorflow.lite import Interpreter
    except Exception:
        Interpreter = None


VIDEO_PATH = "fall2.mp4"

TELEGRAM_TOKEN = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg"
CHAT_ID = "8507257605"

# Comma-separated chat IDs can be provided via env, for example:
# FAMILY_TELEGRAM_CHAT_IDS=8507257605,6607547411
RAW_FAMILY_IDS = os.getenv("FAMILY_TELEGRAM_CHAT_IDS", "").strip()
FAMILY_CHAT_IDS = [cid.strip() for cid in RAW_FAMILY_IDS.split(",") if cid.strip()]
if CHAT_ID not in FAMILY_CHAT_IDS:
    FAMILY_CHAT_IDS.append(CHAT_ID)

ALERT_COOLDOWN = 10 


def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        for chat_id in FAMILY_CHAT_IDS:
            data = {
                "chat_id": chat_id,
                "text": msg
            }
            requests.post(url, data=data, timeout=3)
    except Exception as e:
        print("Telegram error:", e)



INTERPRETER_READY = Interpreter is not None

if INTERPRETER_READY:
    interpreter = Interpreter(model_path="movenet.tflite")
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
else:
    interpreter = None
    input_details = []
    output_details = []
    print("⚠️ TFLite interpreter unavailable; using OpenCV fallback detection.")

bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=40, detectShadows=False)

def detect_pose(frame):
    if not INTERPRETER_READY:
        return None

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


fallback_counter = 0

def detect_fall_fallback(frame):
    global fallback_counter, last_alert_time

    fg = bg_subtractor.apply(frame)
    fg = cv2.GaussianBlur(fg, (5, 5), 0)
    _, fg = cv2.threshold(fg, 180, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        fallback_counter = 0
        return False

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    if area < 1800:
        fallback_counter = 0
        return False

    _, _, w, h = cv2.boundingRect(largest)
    is_horizontal = w > (h * 1.2)

    if is_horizontal:
        fallback_counter += 1
    else:
        fallback_counter = 0

    if fallback_counter > 8 and (time.time() - last_alert_time > ALERT_COOLDOWN):
        last_alert_time = time.time()
        return True

    return False


DISPLAY_WIDTH = 480   
DISPLAY_HEIGHT = 800  

def generate_frames():
    cap = cv2.VideoCapture(VIDEO_PATH)

    if not cap.isOpened():
        print("Error: Could not open video")
        return

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
        if INTERPRETER_READY and keypoints is not None:
            fall = detect_fall(keypoints)
            mode_text = "TFLite"
        else:
            fall = detect_fall_fallback(frame)
            mode_text = "OpenCV Fallback"

        cv2.putText(canvas, f"Mode: {mode_text}", (12, DISPLAY_HEIGHT - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (120, 220, 255), 2, cv2.LINE_AA)

        if fall:
            print("🚨 FALL DETECTED")
            send_telegram("🚨 Fall detected from Guardian Companion OpenCV demo (fall2.mp4). Please check immediately.")
            cv2.putText(canvas, "🚨 FALL DETECTED", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3, cv2.LINE_AA)

        ret, buffer = cv2.imencode('.jpg', canvas)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        # Adding a small sleep so we don't consume 100% CPU when yielding frames fast
        time.sleep(0.03)

if __name__ == '__main__':
    for _ in generate_frames():
        pass

