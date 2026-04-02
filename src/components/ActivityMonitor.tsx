import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PersonStanding, Footprints, Armchair, Clock } from "lucide-react";

type ActivityState = "walking" | "standing" | "sitting" | "resting";

const activityConfig: Record<ActivityState, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  walking: { icon: <Footprints className="w-8 h-8" />, label: "Walking", color: "text-success", bgColor: "bg-success/10" },
  standing: { icon: <PersonStanding className="w-8 h-8" />, label: "Standing", color: "text-warning", bgColor: "bg-warning/10" },
  sitting: { icon: <Armchair className="w-8 h-8" />, label: "Sitting", color: "text-info", bgColor: "bg-info/10" },
  resting: { icon: <Armchair className="w-8 h-8" />, label: "Resting", color: "text-voice", bgColor: "bg-voice/10" },
};

const ActivityMonitor = () => {
  const [activity, setActivity] = useState<ActivityState>("sitting");
  const [duration, setDuration] = useState(0);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [hasReminderFired, setHasReminderFired] = useState(false);
  const [nextReminderThreshold, setNextReminderThreshold] = useState(20);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((d) => d + 1);
    }, 60000); // every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activity === "sitting" && duration >= nextReminderThreshold && !hasReminderFired) {
      setReminderMessage("You have been sitting for a long time. Please take a short walk and stretch your legs.");
      setHasReminderFired(true);
    } else if (activity === "standing" && duration >= nextReminderThreshold && !hasReminderFired) {
      setReminderMessage("You have been standing for a long time. Please sit down and rest for a few minutes.");
      setHasReminderFired(true);
    } else if (activity === "walking" || activity === "resting") {
      setReminderMessage(null);
    }
  }, [activity, duration, hasReminderFired, nextReminderThreshold]);

  const changeActivity = (newActivity: ActivityState) => {
    setActivity(newActivity);
    setDuration(0);
    setReminderMessage(null);
    setHasReminderFired(false);
    setNextReminderThreshold(20 + Math.floor(Math.random() * 11)); // 20 to 30 minutes window
  };

  const config = activityConfig[activity];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-heading font-bold text-slate-100 drop-shadow-sm flex items-center gap-2">
        <Clock className="w-5 h-5 text-warning" />
        Activity Monitor
      </h2>

      {/* Current activity */}
      <motion.div
        key={activity}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${config.bgColor} p-5 rounded-xl flex items-center gap-4`}
      >
        <span className={config.color}>{config.icon}</span>
        <div>
          <p className={`font-heading font-bold text-xl ${config.color}`}>{config.label}</p>
          <p className="text-sm text-muted-foreground">For {duration} min</p>
        </div>
      </motion.div>

      {reminderMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyan-500/10 border border-cyan-300/40 p-3 rounded-lg flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm text-cyan-200 font-body font-medium">{reminderMessage}</p>
            <p className="text-xs text-slate-400">Reminder threshold set to {nextReminderThreshold} minutes.</p>
          </div>
          <button
            onClick={() => setReminderMessage(null)}
            className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-semibold text-white"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Activity selectors */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(activityConfig) as ActivityState[]).map((key) => {
          const ac = activityConfig[key];
          return (
            <button
              key={key}
              onClick={() => changeActivity(key)}
              className={`p-3 rounded-lg flex items-center gap-2 transition-all text-sm font-body font-medium ${
                activity === key
                  ? `${ac.bgColor} ${ac.color} ring-2 ring-current`
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {ac.icon}
              {ac.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityMonitor;
