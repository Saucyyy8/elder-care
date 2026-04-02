import subprocess, re, time, csv

def get_scan():
    # No rescan here! We need high frequency (raw speed)
    res = subprocess.check_output("nmcli -f BSSID,SIGNAL dev wifi", shell=True).decode('utf-8')
    return {m[0]: int(m[1]) for m in re.findall(r"([0-9A-Fa-f:]{17})\s+(\d+)", res)}

# SET YOUR TARGET ACTIVITY: "Walking", "Sitting", "Standing"
LABEL = "Standing"

with open('activity_data.csv', 'a') as f:
    writer = csv.writer(f)
    print(f"Collecting 100 windows for: {LABEL}")
    
    for i in range(100):
        window = []
        for _ in range(10): # Take 10 quick scans per 'window'
            window.append(get_scan())
            time.sleep(0.1)
        
        # FEATURE ENGINEERING (The 'PhD' part)
        # Calculate Mean and StdDev of the strongest BSSID in the window
        # (This is how you distinguish 'Walking' from 'Sitting')
        strongest = max(window[0], key=window[0].get)
        signals = [w.get(strongest, 0) for w in window]
        
        mean_sig = sum(signals)/len(signals)
        std_dev = (sum((x-mean_sig)**2 for x in signals)/len(signals))**0.5
        
        writer.writerow([mean_sig, std_dev, LABEL])
        print(f"[{i}] {LABEL} | Mean: {mean_sig:.1f} | StdDev: {std_dev:.2f}")