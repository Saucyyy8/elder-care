import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, AlertTriangle, CheckCircle, UserRound } from "lucide-react";
import { ML_API_BASE } from "@/lib/mlApi";

interface FallDetectionPanelProps {
  onStatusChange?: (status: "monitoring" | "alert" | "safe") => void;
}

const FallDetectionPanel = ({ onStatusChange }: FallDetectionPanelProps) => {
  const [status, setStatus] = useState<"monitoring" | "alert" | "safe">("monitoring");

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const statusConfig = {
    monitoring: {
      icon: <Shield className="h-6 w-6" />,
      label: "Monitoring",
      color: "bg-cyan-500/20 border-cyan-300/35",
      textColor: "text-cyan-100",
    },
    alert: {
      icon: <AlertTriangle className="h-6 w-6" />,
      label: "Fall Detected!",
      color: "bg-red-600/20 border-red-400/40",
      textColor: "text-red-100",
    },
    safe: {
      icon: <CheckCircle className="h-6 w-6" />,
      label: "All Clear",
      color: "bg-emerald-500/20 border-emerald-300/35",
      textColor: "text-emerald-100",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-heading font-semibold text-slate-100">
        <Activity className="h-5 w-5 text-cyan-200" />
        Fall Detection
      </h2>

      <motion.div
        className={`${config.color} flex items-center gap-3 rounded-2xl border p-4`}
        animate={{ scale: status === "alert" ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: status === "alert" ? Infinity : 0, duration: 1 }}
      >
        <span className={config.textColor}>{config.icon}</span>
        <div>
          <p className={`text-lg font-semibold ${config.textColor}`}>{config.label}</p>
          <p className={`text-sm ${config.textColor} opacity-80`}>
            AI balance check is active
          </p>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-5">
        <p className="mb-3 text-sm text-slate-300">Body Position</p>
        <motion.div
          animate={{
            rotate: status === "alert" ? 90 : 0,
            scale: status === "alert" ? [1, 1.08, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: status === "alert" ? Infinity : 0 }}
          className="flex justify-center"
        >
          <div className={`rounded-full p-8 ${status === "alert" ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
            <UserRound className={`h-24 w-24 ${status === "alert" ? "text-red-300" : "text-emerald-200"}`} />
          </div>
        </motion.div>
        <p className="mt-4 text-center text-lg font-semibold text-slate-100">
          {status === "alert" ? "Fall detected. Help is on the way." : "Standing and stable."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => {
            setStatus("alert");
            fetch(`${ML_API_BASE}/simulate-fall`, { method: "POST" }).catch(console.error);
          }}
          className="min-h-[58px] rounded-xl border border-red-400/35 bg-red-600/25 text-sm font-semibold text-red-100 transition hover:bg-red-600/35"
        >
          SIMULATE FALL
        </button>
        <button
          onClick={() => setStatus("safe")}
          className="min-h-[58px] rounded-xl border border-emerald-300/35 bg-emerald-500/20 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
        >
          I&apos;M OKAY / RESET
        </button>
      </div>
    </div>
  );
};

export default FallDetectionPanel;
