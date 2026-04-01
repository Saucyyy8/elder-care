import subprocess
import re
import joblib
import time
import pandas as pd
import numpy as np
from collections import deque, Counter

# 1. LOAD THE BRAINS
try:
    artifacts = joblib.load("sophisticated_model.pkl")
    model = artifacts['model']
    features = artifacts['features']
    print(f"✅ Model Loaded. Monitoring for {len(features)} BSSIDs.")
except FileNotFoundError:
    print("❌ Error: 'sophisticated_model.pkl' not found. Run train_pro.py first!")
    exit()

# 2. STABILITY BUFFER
# We store the last 5 raw predictions and take a majority vote to stop 'flickering'
history = deque(maxlen=5) 

def get_live_scan():
    try:
        # Force a fresh hardware scan (CRITICAL for moving between rooms)
        subprocess.run(["sudo", "nmcli", "dev", "wifi", "rescan"], capture_output=True)
        
        cmd = "nmcli -f BSSID,SIGNAL dev wifi"
        result = subprocess.check_output(cmd, shell=True).decode('utf-8')
        matches = re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", result)
        
        # Convert signal % to dBm
        return {str(m[0]): (int(m[1])/2)-100 for m in matches}
    except Exception as e:
        print(f"Scan Error: {e}")
        return {}

print("\n--- 🕵️ ELDERLY MONITORING SYSTEM ACTIVE ---")
print("Walk between Room 301, 302, and the Stairs to test.")
print("Press Ctrl+C to stop.\n")

try:
    while True:
        current_scan = get_live_scan()
        
        # 3. FEATURE ALIGNMENT
        # Map live scan to the 46 BSSIDs the model expects
        input_row = [current_scan.get(f, -100) for f in features]
        input_array = np.array(input_row).reshape(1, -1)
        
        # 4. RELATIVE RSSI MATH (Matches Training)
        # We subtract the max signal found in THIS scan from all values
        max_signal = np.max(input_array)
        input_rel = input_array - max_signal
        
        # 5. PREDICT WITH CONFIDENCE
        probs = model.predict_proba(input_rel)[0]
        max_idx = np.argmax(probs)
        raw_pred = model.classes_[max_idx]
        confidence = probs[max_idx]
        
        # 6. TEMPORAL STABILIZATION
        # Only add to history if we are somewhat confident
        if confidence > 0.40:
            history.append(raw_pred)
        
        if len(history) > 0:
            # Majority vote
            stable_location = Counter(history).most_common(1)[0][0]
            
            # Print with a nice clean UI for the judges
            color_code = "\033[92m" if confidence > 0.7 else "\033[93m"
            reset_code = "\033[0m"
            
            print(f"Location: {color_code}{stable_location:15}{reset_code} | Confidence: {confidence*100:5.1f}% | Nodes Seen: {len([s for s in input_row if s > -100])}")
        else:
            print("Location: Calculating...     | Status: Weak Signal")
            
        time.sleep(1) # Frequency of check

except KeyboardInterrupt:
    print("\n\nMonitoring Halted. Demo Finished.")