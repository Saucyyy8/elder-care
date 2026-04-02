import cv2
import mediapipe as mp
import time
import numpy as np
from collections import deque
from flask import Flask, Response, jsonify
from flask_cors import CORS
from threading import Thread

app = Flask(__name__)
CORS(app)

# --- GLOBAL STATE ---
camera_requested = False
latest_frame_bytes = None
latest_activity = {
    "activity": "Initializing...",
    "confidence": 0,
    "is_alert": False
}

# --- MEDIAPIPE TASKS API SETUP ---
BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='pose_landmarker.task'),
    running_mode=VisionRunningMode.IMAGE  # Synchronous - no timestamp issues
)

POSE_CONNECTIONS = frozenset([
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20), (11, 23),
    (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28), (27, 29),
    (28, 30), (29, 31), (30, 32), (27, 31), (28, 32)
])

# Temporal buffer — stores last N frame snapshots for motion energy calculation
BUFFER_SIZE = 20
motion_buffer = deque(maxlen=BUFFER_SIZE)


def get_error_frame(text):
    err_img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(err_img, text, (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    ret, buffer = cv2.imencode('.jpg', err_img)
    return buffer.tobytes()


def get_angle(a, b, c):
    """
    Compute the interior angle at point B in the triangle A-B-C.
    Returns angle in degrees. Invariant to scale/distance from camera.
    """
    ba = np.array([a.x - b.x, a.y - b.y])
    bc = np.array([c.x - b.x, c.y - b.y])
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm < 1e-7:
        return 180.0
    cos_angle = np.clip(np.dot(ba, bc) / norm, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_angle)))


def vis(lm):
    """Helper: safely get visibility of a landmark."""
    return getattr(lm, 'visibility', 0.0) or 0.0


def classify_pose(landmarks):
    """
    TinyML-inspired classification using engineered geometric features:

    Feature 1 — Bounding Box Aspect Ratio:
        If bbox_width / bbox_height > threshold → person is horizontal → RESTING
        (Camera-angle invariant proxy for 'is the person lying down?')

    Feature 2 — Knee Flexion Angle (angle at knee joint):
        ~180° → legs straight → Standing or Walking candidate
        ~90°  → legs bent    → Sitting

    Feature 3 — Hip-Torso Angle (angle at hip joint):
        ~180° → upright torso → Standing or Walking
        ~90°  → leaning/bent  → Sitting or Resting

    Feature 4 — Temporal Motion Energy (std-dev over sliding window):
        Low  → static pose → Standing
        High → movement    → Walking

    Returns: (activity_label, is_alert, confidence_pct)
    """

    # ── Landmark references ──────────────────────────────────────────────────
    nose       = landmarks[0]
    l_shoulder = landmarks[11]
    r_shoulder = landmarks[12]
    l_hip      = landmarks[23]
    r_hip      = landmarks[24]
    l_knee     = landmarks[25]
    r_knee     = landmarks[26]
    l_ankle    = landmarks[27]
    r_ankle    = landmarks[28]
    l_wrist    = landmarks[15]
    r_wrist    = landmarks[16]

    # ── FEATURE 1: Aspect Ratio ──────────────────────────────────────────────
    visible_lms = [lm for lm in landmarks if vis(lm) > 0.3]
    if visible_lms:
        xs = [lm.x for lm in visible_lms]
        ys = [lm.y for lm in visible_lms]
        bbox_w = max(xs) - min(xs)
        bbox_h = max(ys) - min(ys)
        if bbox_h > 0.01 and (bbox_w / bbox_h) > 1.4:
            return "resting", True, 90.0

    # ── FEATURE 2: Knee Flexion Angle ────────────────────────────────────────
    knee_angle = 180.0
    knee_conf  = 0.0
    if vis(r_hip) > 0.4 and vis(r_knee) > 0.4 and vis(r_ankle) > 0.4:
        knee_angle = get_angle(r_hip, r_knee, r_ankle)
        knee_conf  = min(vis(r_hip), vis(r_knee), vis(r_ankle))
    elif vis(l_hip) > 0.4 and vis(l_knee) > 0.4 and vis(l_ankle) > 0.4:
        knee_angle = get_angle(l_hip, l_knee, l_ankle)
        knee_conf  = min(vis(l_hip), vis(l_knee), vis(l_ankle))

    # ── FEATURE 3: Hip-Torso Angle ───────────────────────────────────────────
    hip_angle = 180.0
    hip_conf  = 0.0
    if vis(l_shoulder) > 0.4 and vis(l_hip) > 0.4 and vis(l_knee) > 0.4:
        hip_angle = get_angle(l_shoulder, l_hip, l_knee)
        hip_conf  = min(vis(l_shoulder), vis(l_hip), vis(l_knee))
    elif vis(r_shoulder) > 0.4 and vis(r_hip) > 0.4 and vis(r_knee) > 0.4:
        hip_angle = get_angle(r_shoulder, r_hip, r_knee)
        hip_conf  = min(vis(r_shoulder), vis(r_hip), vis(r_knee))

    # ── FEATURE 4: Temporal Motion Energy ────────────────────────────────────
    snap = {
        'l_ankle_x': l_ankle.x if vis(l_ankle) > 0.3 else None,
        'r_ankle_x': r_ankle.x if vis(r_ankle) > 0.3 else None,
        'l_wrist_y': l_wrist.y if vis(l_wrist) > 0.3 else None,
        'r_wrist_y': r_wrist.y if vis(r_wrist) > 0.3 else None,
        'hip_y':     (l_hip.y + r_hip.y) / 2 if vis(l_hip) > 0.3 and vis(r_hip) > 0.3 else None,
        'nose_x':    nose.x   if vis(nose)    > 0.3 else None,
    }
    motion_buffer.append(snap)

    motion_energy = 0.0
    if len(motion_buffer) >= 10:
        for key in snap:
            vals = [f[key] for f in motion_buffer if f.get(key) is not None]
            if len(vals) >= 6:
                motion_energy += float(np.std(vals))

    # ── CLASSIFICATION ────────────────────────────────────────────────────────
    # SITTING: knee is clearly bent (angle well below straight)
    if knee_angle < 125 and knee_conf > 0.3:
        return "sitting", False, round(knee_conf * 100, 1)

    # Composite: person is broadly upright at this point
    # WALKING: sufficient motion energy while upright
    WALK_THRESHOLD = 0.02   # tune up/down if too sensitive / not sensitive enough
    if motion_energy > WALK_THRESHOLD:
        conf = min(motion_energy * 3000, 97.0)
        return "walking", False, round(conf, 1)

    # STANDING: upright + not moving
    return "standing", False, round(max(hip_conf, knee_conf) * 100 or 80.0, 1)


# ── Camera background worker ─────────────────────────────────────────────────

def camera_background_worker():
    global latest_frame_bytes, latest_activity, camera_requested
    cap = None

    with PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            try:
                if not camera_requested:
                    if cap is not None:
                        cap.release()
                        cap = None
                        motion_buffer.clear()
                        latest_activity["activity"] = "Camera Stopped"
                    time.sleep(0.1)
                    continue

                if cap is None:
                    for i in range(4):
                        temp = cv2.VideoCapture(i)
                        if temp.isOpened():
                            cap = temp
                            motion_buffer.clear()
                            break
                    if cap is None or not cap.isOpened():
                        latest_frame_bytes = get_error_frame("CAMERA NOT FOUND on 0-3")
                        time.sleep(1)
                        continue

                success, frame = cap.read()
                if not success:
                    time.sleep(0.01)
                    continue

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image  = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                results   = landmarker.detect(mp_image)

                cv_img = frame.copy()

                if results.pose_landmarks:
                    landmarks = results.pose_landmarks[0]
                    act, is_alert, conf = classify_pose(landmarks)
                    latest_activity = {
                        "activity":   act,
                        "confidence": conf,
                        "is_alert":   is_alert
                    }

                    # Draw skeleton overlay
                    h, w, _ = cv_img.shape
                    for start_idx, end_idx in POSE_CONNECTIONS:
                        sl = landmarks[start_idx]
                        el = landmarks[end_idx]
                        if vis(sl) > 0.5 and vis(el) > 0.5:
                            cv2.line(cv_img,
                                     (int(sl.x * w), int(sl.y * h)),
                                     (int(el.x * w), int(el.y * h)),
                                     (255, 255, 255), 2)
                    for lm in landmarks:
                        if vis(lm) > 0.5:
                            cv2.circle(cv_img, (int(lm.x * w), int(lm.y * h)), 4, (0, 255, 0), -1)
                else:
                    # Keep last known activity; drop confidence to zero
                    latest_activity["confidence"] = 0

                cv2.putText(cv_img,
                            f"{latest_activity['activity']} ({latest_activity['confidence']}%)",
                            (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2, cv2.LINE_AA)

                ret, buffer = cv2.imencode('.jpg', cv_img)
                latest_frame_bytes = buffer.tobytes()

            except Exception as e:
                print(f"Vision error: {e}")
                time.sleep(0.1)


# ── MJPEG stream ─────────────────────────────────────────────────────────────

def generate_mjpeg_stream():
    while True:
        if latest_frame_bytes is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame_bytes + b'\r\n')
        time.sleep(0.033)   # ~30 fps ceiling


# ── Flask routes ─────────────────────────────────────────────────────────────

@app.route('/activity_feed')
def activity_feed():
    return Response(generate_mjpeg_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/start_cam', methods=['POST'])
def start_cam():
    global camera_requested
    camera_requested = True
    return jsonify({"status": "started"})


@app.route('/stop_cam', methods=['POST'])
def stop_cam():
    global camera_requested
    camera_requested = False
    return jsonify({"status": "stopped"})


@app.route('/activity')
def get_activity():
    if not camera_requested:
        return jsonify({"activity": "resting", "confidence": 0})
    return jsonify(latest_activity)


if __name__ == '__main__':
    Thread(target=camera_background_worker, daemon=True).start()
    app.run(host='0.0.0.0', port=5001)
