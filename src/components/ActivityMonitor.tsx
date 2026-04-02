import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PersonStanding, Footprints, Armchair, Clock } from "lucide-react";

type ActivityState = "walking" | "standing" | "sitting" | "resting";

const activityConfig: Record<ActivityState, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  walking: {
    icon: <Footprints className="h-8 w-8" />,
    label: "Walking",
    color: "text-teal-100",
    bgColor: "bg-teal-500/20",
  },
  standing: {
    icon: <PersonStanding className="h-8 w-8" />,
    label: "Standing",
    color: "text-cyan-100",
    bgColor: "bg-cyan-500/20",
  },
  sitting: {
    icon: <Armchair className="h-8 w-8" />,
    label: "Sitting",
    color: "text-amber-100",
    bgColor: "bg-amber-500/20",
  },
  resting: {
    icon: <Armchair className="h-8 w-8" />,
    label: "Resting",
    color: "text-slate-100",
    bgColor: "bg-slate-600/40",
  },
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
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-heading font-semibold text-slate-100">
        <Clock className="h-5 w-5 text-cyan-200" />
        Activity Monitor
      </h2>

      <motion.div
        key={activity}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${config.bgColor} flex items-center gap-4 rounded-2xl border border-white/15 p-5 shadow-[0_0_28px_rgba(45,212,191,0.2)]`}
      >
        <span className={config.color}>{config.icon}</span>
        <div>
          <p className={`text-xl font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-base text-slate-300">For {duration} min</p>
        </div>
      </motion.div>

      {reminderMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/40 bg-cyan-500/10 p-3"
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

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(activityConfig) as ActivityState[]).map((key) => {
          const ac = activityConfig[key];
          return (
            <button
              key={key}
              onClick={() => changeActivity(key)}
              className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium transition-all ${
                activity === key
                  ? `${ac.bgColor} ${ac.color} ring-1 ring-cyan-200/50`
                  : "bg-slate-900/75 text-slate-300 hover:bg-slate-800"
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
