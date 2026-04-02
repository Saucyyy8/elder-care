import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, AlertTriangle, CheckCircle, UserRound } from "lucide-react";

interface FallDetectionPanelProps {
  onStatusChange?: (status: "monitoring" | "alert" | "safe") => void;
}

const FallDetectionPanel = ({ onStatusChange }: FallDetectionPanelProps) => {
  const [status, setStatus] = useState<"monitoring" | "alert" | "safe">("monitoring");

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const statusConfig = {
    monitoring: { icon: <Shield className="w-6 h-6" />, label: "Monitoring", color: "bg-primary", textColor: "text-primary-foreground" },
    alert: { icon: <AlertTriangle className="w-6 h-6" />, label: "Fall Detected!", color: "bg-sos", textColor: "text-sos-foreground" },
    safe: { icon: <CheckCircle className="w-6 h-6" />, label: "All Clear", color: "bg-success", textColor: "text-success-foreground" },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2" style={{ color: "#E0E0E0" }}>
        <Activity className="w-5 h-5 text-primary" />
        Fall Detection
      </h2>

      <motion.div
        className={`${config.color} p-4 rounded-xl flex items-center gap-3`}
        animate={{ scale: status === "alert" ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: status === "alert" ? Infinity : 0, duration: 1 }}
      >
        <span className={config.textColor}>{config.icon}</span>
        <div>
          <p className={`font-heading font-bold text-lg ${config.textColor}`}>{config.label}</p>
          <p className={`text-sm ${config.textColor} opacity-80`}>
            AI balance check is active
          </p>
        </div>
      </motion.div>

      <div className="rounded-xl border border-white/20 bg-black/20 p-4">
        <p className="text-sm text-slate-300 mb-3">Body position</p>
        <motion.div
          animate={{
            rotate: status === "alert" ? 90 : 0,
            scale: status === "alert" ? [1, 1.08, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: status === "alert" ? Infinity : 0 }}
          className="flex justify-center"
        >
          <div className={`rounded-full p-6 ${status === "alert" ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
            <UserRound className={`h-16 w-16 ${status === "alert" ? "text-red-300" : "text-emerald-300"}`} />
          </div>
        </motion.div>
        <p className="mt-3 text-center text-base" style={{ color: "#E0E0E0" }}>
          {status === "alert" ? "Fall detected. Help is on the way." : "Standing and stable."}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setStatus("alert");
            fetch("http://localhost:5000/simulate-fall", { method: "POST" }).catch(console.error);
          }}
          className="flex-1 min-h-[60px] rounded-lg bg-sos/10 text-sos font-body text-sm font-medium hover:bg-sos/20 transition-colors"
        >
          Simulate Fall
        </button>
        <button
          onClick={() => setStatus("monitoring")}
          className="flex-1 min-h-[60px] rounded-lg bg-primary/10 text-primary font-body text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default FallDetectionPanel;
