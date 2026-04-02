import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, AlertTriangle } from "lucide-react";
import { ASSISTANT_ACTION_EVENT, type AssistantAction } from "@/lib/assistantActions";

interface SOSButtonProps {
  onEmergencyStateChange?: (isEmergency: boolean) => void;
}

const SOSButton = ({ onEmergencyStateChange }: SOSButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSOS = () => {
    if (isActive) {
      setIsActive(false);
      setCountdown(null);
      onEmergencyStateChange?.(false);
      return;
    }
    setIsActive(true);
    onEmergencyStateChange?.(true);
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        
        // Trigger Telegram Alert
        const telegramToken = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg";
        const chatId = "8507257605";
        const message = "🚨 EMERGENCY! The SOS button was pressed on Guardian Companion!";
        
        // 1. Send telegram message
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        }).catch(err => console.error("Failed to send Telegram alert:", err));

        // 2. Send email via local Express backend
        fetch(`http://localhost:3001/api/sos-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            location: "Location data unavailable.",
          }),
        }).catch(err => console.error("Failed to send Email alert:", err));

        // Trigger UI alert
        alert("🚨 Emergency contacts have been notified via Telegram and Email!");
        setIsActive(false);
        onEmergencyStateChange?.(false);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    const onAssistantAction = (event: Event) => {
      const custom = event as CustomEvent<AssistantAction>;
      const action = custom.detail;

      if (!action) {
        return;
      }

      if (action.type === "sos_trigger" && !isActive) {
        handleSOS();
      }

      if (action.type === "sos_cancel" && isActive) {
        handleSOS();
      }
    };

    window.addEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
    return () => window.removeEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
  }, [isActive]);

  return (
    <motion.div
      className="relative flex flex-col items-center gap-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <span className={`absolute -inset-10 rounded-full ${isActive ? "animate-ping bg-red-500/35" : "bg-red-400/20"}`} />
      <button
        onClick={handleSOS}
        className={`relative h-48 w-48 rounded-full flex items-center justify-center border border-red-200/50 transition-all duration-300 shadow-[inset_10px_10px_24px_rgba(255,190,190,0.15),inset_-12px_-12px_24px_rgba(120,10,10,0.55),0_20px_40px_rgba(220,38,38,0.55)] ${
          isActive
            ? "bg-sos animate-sos-pulse"
            : "bg-gradient-to-br from-red-500 via-red-600 to-red-800 hover:scale-105"
        }`}
      >
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="cancel"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <X className="w-10 h-10 text-sos-foreground" />
              <span className="text-sos-foreground font-heading text-lg font-bold">
                {countdown}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="sos"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <Phone className="w-10 h-10 text-sos-foreground" />
              <span className="text-sos-foreground font-heading text-2xl font-extrabold tracking-wide">
                SOS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.17em] text-red-100">
          {isActive ? "Emergency Countdown Running" : "Press & Hold For Emergency"}
        </p>
        <p className="text-xs text-slate-300">{isActive ? "Tap again to cancel." : "Safety hotline and family contacts will be notified."}</p>
      </div>
      {!isActive && (
        <div className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/10 px-4 py-1 text-xs text-red-100">
          <AlertTriangle className="h-3.5 w-3.5" />
          Central Emergency Control
        </div>
      )}
      <p className="max-w-[230px] text-center text-[11px] uppercase tracking-[0.18em] text-red-200/90">
        phone support enabled
      </p>
    </motion.div>
  );
};

export default SOSButton;
