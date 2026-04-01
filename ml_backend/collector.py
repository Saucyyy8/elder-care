import subprocess
import re
import pandas as pd
import time
import os

def get_wifi_scan():
    try:
        # Linux command to get BSSID and Signal strength
        cmd = "nmcli -f BSSID,SIGNAL dev wifi"
        result = subprocess.check_output(cmd, shell=True).decode('utf-8')
        
        # Regex to find BSSID (xx:xx:xx:xx:xx:xx) and Signal (0-100)
        # Matches patterns like: 00:11:22:33:44:55  85
        matches = re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", result)
        
        # Convert signal % to dBm (Roughly: dBm = (percentage / 2) - 100)
        data = {m[0]: (int(m[1])/2)-100 for m in matches}
        return data
    except Exception as e:
        print(f"Error scanning: {e}")
        return {}

# COLLECTION LOOP
room_name = input("Which room are you in? (e.g., Room 301): ")
fingerprints = []

print(f"Recording 50 scans for {room_name}... Walk slowly around the room.")

for i in range(50):
    scan = get_wifi_scan()
    if scan:
        scan['label'] = room_name
        fingerprints.append(scan)
        print(f"Scan {i+1}/50 captured ({len(scan)-1} APs found)")
    else:
        print("No Wi-Fi signals found. Is your Wi-Fi on?")
    time.sleep(1) 

if fingerprints:
    df = pd.DataFrame(fingerprints)
    # Append to CSV, create if it doesn't exist
    file_exists = os.path.isfile("wifi_fingerprints.csv")
    df.to_csv("wifi_fingerprints.csv", mode='a', index=False, header=not file_exists)
    print(f"\nSuccess! Data for {room_name} saved to wifi_fingerprints.csv")
else:
    print("No data collected.")