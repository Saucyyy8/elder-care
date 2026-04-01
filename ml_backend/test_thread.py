import subprocess, re, time, numpy as np, csv
from datetime import datetime
from app import get_live_scan, features, model, le, latest_data
try:
    print("STARTING")
    scan = get_live_scan()
    print("SCAN:", list(scan.keys())[:3] if scan else "EMPTY")
    row = np.array([scan.get(f, -100) for f in features]).reshape(1, -1)
    print("ROW MAX:", np.max(row))
    row_rel = row - np.max(row)
    probs = model.predict_proba(row_rel)[0]
    print("PROBS:", probs)
    max_idx = np.argmax(probs)
    new_location = le.inverse_transform([max_idx])[0]
    print("LOCATION:", new_location)
except Exception as e:
    import traceback
    traceback.print_exc()
