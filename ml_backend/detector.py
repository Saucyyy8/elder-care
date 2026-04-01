import subprocess
import re
import joblib
import time
import pandas as pd
import numpy as np
from collections import Counter

# 1. LOAD THE BRAINS
try:
    model, feature_columns = joblib.load("room_model.pkl")
    print(f"Model loaded. Monitoring for {len(feature_columns)} specific BSSIDs.")
except Exception as e:
    print(f"Error loading model: {e}. Did you run classifier.py first?")
    exit()

def get_live_scan():
    try:
        # Linux nmcli command
        cmd = "nmcli -f BSSID,SIGNAL dev wifi"
        result = subprocess.check_output(cmd, shell=True).decode('utf-8')
        matches = re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", result)
        # Convert to dBm and ensure BSSID is a string
        return {str(m[0]): (int(m[1])/2)-100 for m in matches}
    except:
        return {}

# 2. THE STABILITY BUFFER
# We keep the last 5 predictions and take the "Majority Vote"
prediction_buffer = []

print("\n--- ELDERLY MONITORING ACTIVE ---")
print("Walking around... Press Ctrl+C to stop.\n")

try:
    while True:
        current_signals = get_live_scan()
        
        # 3. ALIGNMENT (The most important part)
        # Create a dictionary of the features the model expects, default to -100
        input_dict = {bss: current_signals.get(bss, -100) for bss in feature_columns}
        
        # Convert to DataFrame so sklearn sees the feature names it was trained on
        input_df = pd.DataFrame([input_dict])
        input_df.columns = input_df.columns.astype(str) # Match the training type
        
        # 4. PREDICT
        raw_pred = model.predict(input_df)[0]
        prediction_buffer.append(raw_pred)
        
        if len(prediction_buffer) > 5:
            prediction_buffer.pop(0)
        
        # --- DEBUG START ---
        active_signals = [s for s in input_dict.values() if s > -100]
        print(f"DEBUG: Found {len(active_signals)} out of {len(feature_columns)} known BSSIDs.")
        if len(active_signals) == 0:
            print("⚠️ WARNING: Detector sees ZERO BSSIDs from your training set!")
        # --- DEBUG END ---
            
        # 5. MAJORITY VOTE
        stable_location = Counter(prediction_buffer).most_common(1)[0][0]
        
        # UI Output
        status = "✅ STABLE" if raw_pred == stable_location else "⚠️ SHIFTING"
        print(f"[{status}] Predicted: {raw_pred:15} | Locked Location: {stable_location}")
        
        time.sleep(1) # Frequency of check

except KeyboardInterrupt:
    print("\nMonitoring stopped by user.")