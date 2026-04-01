import subprocess
import re
import joblib
import time
import numpy as np
from flask import Flask, jsonify
from flask_cors import CORS
from threading import Thread
import csv
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from collections import deque

load_dotenv()
TELEGRAM_BOT_TOKEN = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg"
TELEGRAM_CHAT_ID = "8507257605"

def send_telegram_notification(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message}, timeout=5)
    except Exception as e:
        print(f"Telegram error: {e}")


# --- CONFIGURATION ---
app = Flask(__name__)
CORS(app) # Crucial for hackathon: prevents 'Cross-Origin' browser errors

# Load the Brains
try:
    art = joblib.load("ensemble_model.pkl")
    model = art['model']
    features = art['features']
    le = art['le']
    print(f"✅ Model Loaded. Features: {len(features)}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# Global state to store the 'Latest' results
latest_data = {
    "location": "Calibrating...",
    "confidence": 0,
    "status": "Scanning",
    "timestamp": 0
}

# --- SCANNING LOGIC ---
def get_live_scan():
    try:
        # Force fresh hardware scan (no sudo to prevent freezing)
        subprocess.run(["nmcli", "dev", "wifi", "rescan"], capture_output=True)
        res = subprocess.check_output("nmcli -f BSSID,SIGNAL dev wifi", shell=True).decode('utf-8')
        matches = re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", res)
        return {str(m[0]): (int(m[1])/2)-100 for m in matches}
    except:
        return {}

def detector_worker():
    """ Background thread that updates the global state """
    global latest_data
    prob_buffer = deque(maxlen=10)
    DECAY_FACTOR = 0.85
    
    last_predicted_location = None
    consecutive_count = 0
    
    while True:
        scan = get_live_scan()
        if not scan:
            time.sleep(0.5)
            continue
            
        # 1. Feature Alignment
        row = np.array([scan.get(f, -100) for f in features]).reshape(1, -1)
        
        # 2. Relative RSSI Math
        row_rel = row - np.max(row)
        
        # 3. XGBoost Prediction & Probability Decay
        current_probs = model.predict_proba(row_rel)[0]
        prob_buffer.append(current_probs)
        
        weighted_probs = np.zeros(len(le.classes_))
        for i, p_vec in enumerate(reversed(prob_buffer)):
            weighted_probs += p_vec * (DECAY_FACTOR ** i)
            
        best_idx = np.argmax(weighted_probs)
        new_location = le.inverse_transform([best_idx])[0]
        
        if new_location == last_predicted_location:
            consecutive_count += 1
        else:
            last_predicted_location = new_location
            consecutive_count = 1
        
        # Check if location changed (Only log on transitions)
        if latest_data["location"] != new_location and consecutive_count >= 2:
            latest_data["location"] = new_location
            
            # Log transition to CSV
            with open("location_log.csv", "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([datetime.now().isoformat(), new_location, round(float(current_probs[np.argmax(current_probs)]), 2)])
                
            # Entered a new room! Check trigger
            if "302" in new_location.lower() or new_location == "Room 302":
                send_telegram_notification(f"Alert: Resident has entered {new_location}.")
                
        # Update generic UI data instantly
        latest_data["confidence"] = round(float(current_probs[np.argmax(current_probs)]) * 100, 2)
        latest_data["status"] = "Active"
        latest_data["timestamp"] = time.time()
        
        time.sleep(0.5) # Scan frequency
# --- API ENDPOINTS ---

@app.route('/status', methods=['GET'])
def status():
    """ Endpoint for the website to poll """
    return jsonify(latest_data)

@app.route('/log', methods=['GET'])
def get_log():
    """ Endpoint for heatmap data visualization """
    if not os.path.exists("location_log.csv"):
        return jsonify([])
    data = []
    try:
        with open("location_log.csv", "r") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 3:
                    data.append({"timestamp": row[0], "location": row[1], "confidence": float(row[2])})
    except Exception as e:
        print(f"Error reading log: {e}")
    return jsonify(data)

if __name__ == '__main__':
    # Start scanning in a separate thread
    scanner_thread = Thread(target=detector_worker, daemon=True)
    scanner_thread.start()
    
    # Run the Flask Server
    print("🚀 API Running on http://localhost:5000/status")
    app.run(host='0.0.0.0', port=5000, debug=False)