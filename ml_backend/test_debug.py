from app import get_live_scan
print("Scan:", get_live_scan())
import subprocess
try:
    print("rescan:", subprocess.run(["nmcli", "dev", "wifi", "rescan"], capture_output=True))
    res = subprocess.check_output("nmcli -f BSSID,SIGNAL dev wifi", shell=True).decode('utf-8')
    print("output:", len(res))
except Exception as e:
    print("Exception:", e)
