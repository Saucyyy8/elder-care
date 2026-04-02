import { useEffect, useState, useRef } from "react";
import { Activity } from "lucide-react";

interface LogEntry {
  timestamp: string;
  location: string;
  confidence: number;
}

interface LocationLogProps {
  onSosTrigger?: () => void;
}

const LocationLog = ({ onSosTrigger }: LocationLogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [room302Minutes, setRoom302Minutes] = useState(0);
  const [sosSent, setSosSent] = useState(false);
  const [locationAlert, setLocationAlert] = useState<string | null>(null);
  const room302StartRef = useRef<number | null>(null);
  const notificationsRef = useRef<{ room302: boolean }>({ room302: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/log");
        if (res.ok) {
          const json: LogEntry[] = await res.json();
          // We only take the most recent 50 to avoid crazy DOM size over long period
          setLogs(json.slice(-50));

          const latestLog = json[json.length - 1];
          const now = Date.now();
          if (latestLog?.location?.toLowerCase().includes("302")) {
            if (!room302StartRef.current) {
              room302StartRef.current = now;
              setLocationAlert("Room 302 entry detected. Monitoring for 10+ minutes...");
            }

            const elapsedMS = now - (room302StartRef.current ?? now);
            const elapsedMin = Math.floor(elapsedMS / 60000);
            setRoom302Minutes(elapsedMin);

            if (elapsedMS >= 10 * 60000 && !notificationsRef.current.room302) {
              notificationsRef.current.room302 = true;
              setSosSent(true);
              setLocationAlert("Room 302 occupancy exceeded 10 minutes. Sending SOS alert...");
              onSosTrigger?.();

              const telegramToken = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg";
              const chatId = "8507257605";
              const message = "🚨 AUTO SOS: Resident has been in Room 302 for over 10 minutes.";

              fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message }),
              }).catch((err) => console.error("Failed to send Telegram SOS:", err));

              fetch(`http://localhost:3001/api/sos-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, location: "Room 302" }),
              }).catch((err) => console.error("Failed to send Email SOS:", err));
            }
          } else {
            room302StartRef.current = null;
            notificationsRef.current.room302 = false;
            setRoom302Minutes(0);
            setSosSent(false);
            setLocationAlert(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };
    
    // Polling every 2.5 seconds to match the 5-scan buffer
    fetchLogs();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [onSosTrigger]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-fuchsia-400" />
        <h3 className="text-xl font-heading font-bold" style={{ color: "#E0E0E0" }}>Location Tracker Log</h3>
      </div>
      
      {locationAlert && (
        <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          {locationAlert} {room302Minutes > 0 && `(Room 302 for ${room302Minutes} min)`}
          {sosSent && " - SOS alert dispatched."}
        </div>
      )}
      <div className="flex-1 overflow-hidden" style={{ minHeight: "200px" }}>
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            Waiting for real-time scans...
          </div>
        ) : (
          <div 
            ref={scrollRef} 
            className="flex h-full flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-cyan-500/50"
            style={{ maxHeight: "280px" }}
          >
            {logs.map((log, i) => {
              // Parse out the time
              const dateObj = new Date(log.timestamp);
              const timeString = isNaN(dateObj.getTime()) 
                ? log.timestamp 
                : dateObj.toLocaleTimeString([], { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });

              return (
                <div 
                  key={`${timeString}-${i}`} 
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/50 p-3 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{log.location}</span>
                    <span className="text-xs text-slate-400">{timeString}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    <span className="font-mono text-xs text-cyan-200">{log.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationLog;
