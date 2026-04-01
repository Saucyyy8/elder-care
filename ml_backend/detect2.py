import subprocess, re, joblib, time, numpy as np
from collections import deque

# LOAD
art = joblib.load("ensemble_model.pkl")
model, features, le = art['model'], art['features'], art['le']

# PROBABILITY BUFFER
# We store the probability vectors of the last 10 scans
prob_buffer = deque(maxlen=10)
DECAY_FACTOR = 0.85 

def get_scan():
    try:
        subprocess.run(["sudo", "nmcli", "dev", "wifi", "rescan"], capture_output=True)
        res = subprocess.check_output("nmcli -f BSSID,SIGNAL dev wifi", shell=True).decode('utf-8')
        matches = re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", res)
        return {str(m[0]): (int(m[1])/2)-100 for m in matches}
    except: return {}

print("--- 🦾 ADVANCED ENsemble MONITORING ACTIVE ---")

while True:
    scan = get_scan()
    row = np.array([scan.get(f, -100) for f in features]).reshape(1, -1)
    row_rel = row - np.max(row)
    
    # Get Probability Vector (e.g., [0.1, 0.8, 0.1])
    current_probs = model.predict_proba(row_rel)[0]
    prob_buffer.append(current_probs)
    
    # Apply Exponential Decay to the buffer
    # Most recent scan has weight 1.0, previous is 0.85, then 0.72, etc.
    weighted_probs = np.zeros(len(le.classes_))
    for i, p_vec in enumerate(reversed(prob_buffer)):
        weight = DECAY_FACTOR ** i
        weighted_probs += p_vec * weight
    
    # Get the best room from the weighted sum
    best_idx = np.argmax(weighted_probs)
    stable_room = le.inverse_transform([best_idx])[0]
    confidence = current_probs[max(0, np.argmax(current_probs))]
    
    # Status Indicators
    indicator = "🟢" if confidence > 0.7 else "🟡" if confidence > 0.4 else "🔴"
    print(f"Location: {stable_room:15} | Confidence: {confidence*100:5.1f}% {indicator}")
    
    time.sleep(0.7)