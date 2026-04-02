import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PersonStanding, Footprints, Armchair, Clock, Play, Square, Video } from "lucide-react";

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
  const [confidence, setConfidence] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(Date.now());
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [hasReminderFired, setHasReminderFired] = useState(false);
  const [nextReminderThreshold, setNextReminderThreshold] = useState(20);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let durationTimer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        fetch('http://localhost:5001/activity')
          .then(res => res.json())
          .then(data => {
            if (data.activity && data.activity !== "Initializing...") {
              setActivity((prev) => {
                if (prev !== data.activity.toLowerCase()) {
                  setDuration(0);
                }
                return data.activity.toLowerCase() as ActivityState;
              });
              setConfidence(data.confidence || 0);
            }
          })
          .catch(err => console.error(err));
      }, 500);

      // Duration counter only runs while camera is on
      durationTimer = setInterval(() => {
        setDuration((d) => d + 1);
      }, 60000);
    } else {
      setActivity("resting");
      setConfidence(0);
    }

    return () => {
      clearInterval(timer);
      clearInterval(durationTimer);
    };
  }, [isActive]);

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

  const handleToggle = async () => {
    try {
      const newState = !isActive;
      await fetch(`http://localhost:5001/${newState ? 'start_cam' : 'stop_cam'}`, { method: "POST" });
      setIsActive(newState);
      if (newState) setSessionTime(Date.now());
    } catch (e) {
      console.error(e);
    }
  };

  const config = activityConfig[activity] || activityConfig['resting'];

  return (
    <div className="space-y-4">
<<<<<<< HEAD
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-slate-100 drop-shadow-sm flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Activity Monitor
        </h2>
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border ${
            isActive 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" 
              : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30"
          }`}
        >
          {isActive ? (
            <><Square className="h-3 w-3" fill="currentColor" /> Stop Cam</>
          ) : (
            <><Play className="h-3 w-3" fill="currentColor" /> Start Cam</>
          )}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 h-48 w-full mt-2 flex items-center justify-center">
         {isActive ? (
            <img 
              src={`http://localhost:5001/activity_feed?t=${sessionTime}`} 
              alt="Live WebCam" 
              className="object-cover h-full w-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
         ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
              <Video className="w-8 h-8 opacity-50" />
              <span>Camera OFF. Click Start Cam.</span>
            </div>
         )}
      </div>
=======
      <h2 className="flex items-center gap-2 text-xl font-heading font-semibold text-slate-100">
        <Clock className="h-5 w-5 text-cyan-200" />
        Activity Monitor
      </h2>
>>>>>>> 8aea66f (Add dashboard, assistant, vitals, memories and fall-detection updates)

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

<<<<<<< HEAD
      {/* Live Confidence Bar */}
      <div className="mt-4 flex flex-col gap-1">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Detection Confidence</p>
        <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            className={`h-full rounded-full transition-all duration-300 ${activity === 'resting' ? 'bg-red-400' : 'bg-emerald-400'}`} 
          />
        </div>
=======
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
>>>>>>> 8aea66f (Add dashboard, assistant, vitals, memories and fall-detection updates)
      </div>
    </div>
  );
};

export default ActivityMonitor;
