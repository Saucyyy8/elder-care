import { useEffect, useState, useRef } from "react";
import { MapPin, Clock, FlaskConical } from "lucide-react";
import { toast } from "sonner";

interface LocationData {
  location: string;
  confidence: number;
  status: string;
  timestamp: number;
  anomaly_alert?: boolean;
  anomaly_message?: string;
  time_in_room?: number;
  dev_mode?: boolean;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const LocationTracker = () => {
  const [data, setData] = useState<LocationData>({ location: "Calibrating...", confidence: 0, status: "Scanning", timestamp: 0 });
  const prevLocationRef = useRef<string>("");
  const prevAnomalyRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("http://localhost:5000/status");
        if (res.ok) {
          const json: LocationData = await res.json();
          setData(json);

          // Trigger toast on Room 302
          if (json.location !== prevLocationRef.current) {
            const lowLoc = json.location.toLowerCase();
            const prevLowLoc = prevLocationRef.current.toLowerCase();
            
            if (lowLoc.includes("302") && !prevLowLoc.includes("302")) {
              toast.error("Alert: Resident has entered Room 302!", {
                description: "Security / Room 302 notification triggered.",
                duration: 8000,
              });
            }
            prevLocationRef.current = json.location;
          }

          // Trigger speech analysis for time anomalies
          if (json.anomaly_alert && !prevAnomalyRef.current) {
            toast.warning("Room Anomaly Detected", {
              description: json.anomaly_message,
              duration: 10000,
            });
            prevAnomalyRef.current = true;
            
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(json.anomaly_message || "Alert, anomaly detected.");
              utterance.lang = 'en-US';
              utterance.rate = 1.0;
              window.speechSynthesis.speak(utterance);
            }
          } else if (!json.anomaly_alert) {
            prevAnomalyRef.current = false;
          }
        }
      } catch (err) {
        console.error("Failed to fetch location", err);
      }
    };

    const interval = setInterval(fetchLocation, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleDevMode = async () => {
    try {
      const res = await fetch("http://localhost:5000/toggle-dev-mode", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({ ...prev, dev_mode: json.dev_mode }));
        toast.info(json.dev_mode ? "Dev Mode Enabled (1s = 1m)" : "Dev Mode Disabled", {
          duration: 3000,
        });
      } else {
        toast.error(`Backend error: Make sure app.py was restarted. Status: ${res.status}`);
      }
    } catch (err) {
      toast.error("Network error: Could not reach backend server.");
      console.error("Failed to toggle dev mode", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center relative w-full h-full">
      <div className="w-full flex justify-end mb-2">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleDevMode();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all z-50 cursor-pointer hover:scale-105 active:scale-95 shadow-md ${
            data.dev_mode 
              ? "border-purple-400 bg-purple-500/30 text-purple-200" 
              : "border-slate-600 bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Toggle Dev Mode (1s = 1m)"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          {data.dev_mode ? "Dev Mode: ON" : "Dev Mode: OFF"}
        </button>
      </div>

      <div className="mb-2 rounded-full bg-cyan-400/20 p-4 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
        <MapPin className="h-8 w-8 text-cyan-400" />
      </div>
      <h3 className="mb-1 text-xl font-heading font-bold" style={{ color: "#E0E0E0" }}>Current Location</h3>
      <p className="text-3xl font-black text-white dropshadow-md">{data.location}</p>
      
      <div className="mt-4 flex items-center justify-center gap-4 w-full px-4">
        <p className="text-sm text-cyan-200">Confidence: <span className="font-mono">{data.confidence.toFixed(1)}%</span></p>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex items-center gap-1.5 text-sm text-cyan-200">
          <Clock className="h-4 w-4 opacity-70" />
          <span className="font-mono">{formatTime(data.dev_mode ? (data.time_in_room || 0) * 60 : (data.time_in_room || 0))}</span>
        </div>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 border border-cyan-200/20">
        <div className={`h-2 w-2 rounded-full ${data.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        <span className="text-xs font-semibold uppercase text-slate-300">{data.status}</span>
      </div>
    </div>
  );
};

export default LocationTracker;
