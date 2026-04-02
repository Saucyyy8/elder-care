import { useState } from "react";
import { Video, Play, Square } from "lucide-react";
import { ML_API_BASE } from "@/lib/mlApi";

const FallDetectionVideo = () => {
  const [isActive, setIsActive] = useState(false);
  // Optional timestamp to force reload image when restarting
  const [sessionTime, setSessionTime] = useState(Date.now());

  const handleToggle = () => {
    setIsActive((prev) => {
      if (!prev) {
        setSessionTime(Date.now());
      }
      return !prev;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-heading font-bold" style={{ color: "#E0E0E0" }}>Live Fall Detection</h3>
          <Video className="h-5 w-5 text-cyan-400" />
        </div>
        
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            isActive 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" 
              : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
          }`}
        >
          {isActive ? (
            <>
              <Square className="h-3 w-3" fill="currentColor" /> Stop Demo
            </>
          ) : (
            <>
              <Play className="h-3 w-3" fill="currentColor" /> Start Demo
            </>
          )}
        </button>
      </div>
      
      <div className="relative flex-1 min-h-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
        {isActive ? (
          <img
            src={`${ML_API_BASE}/video_feed?t=${sessionTime}`}
            alt="Live Monitoring"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 flex-col gap-2">
            <Video className="h-8 w-8 opacity-50" />
            <span>Click 'Start Demo' to run simulation</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center -z-10 text-sm text-slate-500">
          Video feed offline
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        AI movement tracking via internal cameras to identify dangerous falls in real-time.
      </p>
    </div>
  );
};

export default FallDetectionVideo;
