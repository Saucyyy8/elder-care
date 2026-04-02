import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Droplets, Footprints, HeartPulse, Pill, Plus, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASSISTANT_ACTION_EVENT, type AssistantAction } from "@/lib/assistantActions";

interface CheckItem {
  id: string;
  label: string;
  icon: "pill" | "meal" | "walk" | "water" | "sleep" | "heart";
  time: string;
  done: boolean;
}

interface ReminderNotificationPayload {
  title: string;
  body: string;
  profileName: string;
  itemLabel: string;
  timeLabel: string;
}

interface DailyChecklistProps {
  onReminderNotification?: (payload: ReminderNotificationPayload) => void;
  onChecklistSnapshot?: (payload: {
    profileName: string;
    items: Array<{ id: string; label: string; time: string; done: boolean }>;
  }) => void;
}

const initialItems: CheckItem[] = [
  { id: "1", label: "Drink Water", icon: "water", time: "09:00 AM", done: true },
  { id: "2", label: "BP Check", icon: "heart", time: "12:30 PM", done: false },
  { id: "3", label: "Afternoon Med", icon: "pill", time: "03:30 PM", done: false },
  { id: "4", label: "Light Walk", icon: "walk", time: "05:30 PM", done: true },
  { id: "5", label: "Evening Hydration", icon: "water", time: "06:00 PM", done: true },
  { id: "6", label: "Dinner Medicine", icon: "pill", time: "08:00 PM", done: false },
  { id: "7", label: "Night BP Check", icon: "heart", time: "09:00 PM", done: true },
  { id: "8", label: "Sleep Prep", icon: "heart", time: "09:30 PM", done: true },
];

const CHECKLIST_STORAGE_KEY = "guardianChecklistPrimary";
const ADMIN_ACCESS_CODE = "GuardianFamily2026";
const MED_STOCK_STORAGE_KEY = "guardianMedicationStock";
const MED_CONSUMPTION_LOG_STORAGE_KEY = "guardianMedicationConsumptionLog";
const TELEGRAM_TOKEN = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg";
const TELEGRAM_CHAT_ID = "8507257605";

const normalizeItems = (items: CheckItem[]): CheckItem[] =>
  items.map((item, idx) => ({
    id: item.id || `${Date.now()}-${idx}`,
    label: item.label || "Untitled Task",
    icon: item.icon || "heart",
    time: item.time || "12:00 PM",
    done: Boolean(item.done),
  }));

const iconByType: Record<CheckItem["icon"], React.ReactNode> = {
  pill: <Pill className="h-5 w-5" />,
  meal: <HeartPulse className="h-5 w-5" />,
  walk: <Footprints className="h-5 w-5" />,
  water: <Droplets className="h-5 w-5" />,
  sleep: <HeartPulse className="h-5 w-5" />,
  heart: <HeartPulse className="h-5 w-5" />,
};

const formatCurrentTimeLabel = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const isMedicineTask = (item: CheckItem) => item.icon === "pill" || /med|medicine|tablet|pill/i.test(item.label);

const defaultMedicationStockForItem = (item: CheckItem) =>
  isMedicineTask(item) ? 30 : 0;

const DailyChecklist = ({ onReminderNotification, onChecklistSnapshot }: DailyChecklistProps) => {
  const userName = localStorage.getItem("authUserName") || "Resident";
  const [items, setItems] = useState<CheckItem[]>(initialItems);
  const [medicineStock, setMedicineStock] = useState<Record<string, number>>({});
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemTime, setNewItemTime] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const notifiedReminderIds = useRef<Set<string>>(new Set());
  const medicineConsumptionLogRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  const sendTelegramMessage = async (message: string) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      });
    } catch (error) {
      console.error("Failed to send Telegram message", error);
    }
  };

  const buildChecklistSummaryMessage = (nextItems: CheckItem[]) => {
    const done = nextItems.filter((item) => item.done);
    const remaining = nextItems.filter((item) => !item.done);

    const formatRows = (rows: CheckItem[]) =>
      rows.length > 0
        ? rows.map((item, index) => `${index + 1}. ${item.label} (${item.time})`).join("\n")
        : "None";

    return [
      "Guardian Companion Reminder Summary",
      `Resident: ${userName}`,
      "",
      `Done Reminders (${done.length}):`,
      formatRows(done),
      "",
      `Remaining Reminders (${remaining.length}):`,
      formatRows(remaining),
    ].join("\n");
  };

  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => {
        console.error("Notification permission request failed", error);
      });
    }

    const savedChecklist = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (savedChecklist) {
      try {
        const parsedChecklist = JSON.parse(savedChecklist) as CheckItem[];
        if (Array.isArray(parsedChecklist) && parsedChecklist.length > 0) {
          setItems(normalizeItems(parsedChecklist));
        }
      } catch (error) {
        console.error("Failed to parse saved checklist", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const savedStock = localStorage.getItem(MED_STOCK_STORAGE_KEY);
    const savedConsumptionLog = localStorage.getItem(MED_CONSUMPTION_LOG_STORAGE_KEY);

    if (savedStock) {
      try {
        const parsed = JSON.parse(savedStock) as Record<string, number>;
        setMedicineStock(parsed);
      } catch (error) {
        console.error("Failed to parse medication stock", error);
      }
    } else {
      const seededStock = initialItems.reduce<Record<string, number>>((acc, item) => {
        if (isMedicineTask(item)) {
          acc[item.id] = defaultMedicationStockForItem(item);
        }
        return acc;
      }, {});
      setMedicineStock(seededStock);
    }

    if (savedConsumptionLog) {
      try {
        const parsed = JSON.parse(savedConsumptionLog) as string[];
        medicineConsumptionLogRef.current = new Set(parsed);
      } catch (error) {
        console.error("Failed to parse medication consumption log", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(MED_STOCK_STORAGE_KEY, JSON.stringify(medicineStock));
  }, [medicineStock]);

  useEffect(() => {
    onChecklistSnapshot?.({
      profileName: userName,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        time: item.time,
        done: item.done,
      })),
    });
  }, [items, onChecklistSnapshot, userName]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nowLabel = formatCurrentTimeLabel(now);
      const dateKey = now.toISOString().slice(0, 10);

      items.forEach((item) => {
        const reminderKey = `default:${dateKey}:${item.id}`;
        const shouldNotify = !item.done && item.time === nowLabel;

        if (!shouldNotify || notifiedReminderIds.current.has(reminderKey)) {
          return;
        }

        notifiedReminderIds.current.add(reminderKey);
        const payload: ReminderNotificationPayload = {
          title: "Checklist Reminder",
          body: `${userName}: ${item.label} (${item.time})`,
          profileName: userName,
          itemLabel: item.label,
          timeLabel: item.time,
        };

        onReminderNotification?.(payload);

        if (window.Notification && Notification.permission === "granted") {
          new Notification(payload.title, { body: payload.body });
        }

        toast({
          title: payload.title,
          description: payload.body,
        });
      });
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [items, onReminderNotification, toast, userName]);

  const toggle = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const willMarkDone = !target.done;
    const dateKey = new Date().toISOString().slice(0, 10);
    const consumptionKey = `${dateKey}:${id}`;
    let lowStockMessage: string | null = null;

    if (willMarkDone && isMedicineTask(target) && !medicineConsumptionLogRef.current.has(consumptionKey)) {
      setMedicineStock((prev) => {
        const current = prev[id] ?? defaultMedicationStockForItem(target);
        const next = Math.max(current - 1, 0);

        if (next === 5) {
          lowStockMessage = `Low stock alert: ${target.label} has only 5 tablets left. Please reorder soon.`;
        }

        return { ...prev, [id]: next };
      });

      medicineConsumptionLogRef.current.add(consumptionKey);
      localStorage.setItem(
        MED_CONSUMPTION_LOG_STORAGE_KEY,
        JSON.stringify(Array.from(medicineConsumptionLogRef.current)),
      );
    }

    const updatedItems = items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
    setItems(updatedItems);

    const summaryMessage = buildChecklistSummaryMessage(updatedItems);
    await sendTelegramMessage(summaryMessage);

    if (lowStockMessage) {
      toast({
        title: "Medication Stock Alert",
        description: lowStockMessage,
      });
      await sendTelegramMessage(lowStockMessage);
    }
  };

  const updateItem = (id: string, key: "label" | "time", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    if (!newItemLabel.trim() || !newItemTime.trim()) {
      toast({
        title: "Missing details",
        description: "Please add both task name and reminder time.",
        variant: "destructive",
      });
      return;
    }

    const createdItem: CheckItem = {
      id: `${Date.now()}`,
      label: newItemLabel.trim(),
      time: newItemTime.trim(),
      done: false,
      icon: "heart",
    };

    setItems((prev) => [...prev, createdItem]);
    if (isMedicineTask(createdItem)) {
      setMedicineStock((prev) => ({ ...prev, [createdItem.id]: 30 }));
    }
    setNewItemLabel("");
    setNewItemTime("");
  };

  const completedCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const openSettings = () => {
    setSettingsOpen(true);
    setAdminUnlocked(false);
    setAdminPassInput("");
    setAdminError("");
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setAdminUnlocked(false);
    setAdminPassInput("");
    setAdminError("");
  };

  const unlockAdmin = () => {
    if (adminPassInput !== ADMIN_ACCESS_CODE) {
      setAdminError("Incorrect password. Please try again.");
      return;
    }
    setAdminUnlocked(true);
    setAdminError("");
  };

  useEffect(() => {
    const onAssistantAction = (event: Event) => {
      const custom = event as CustomEvent<AssistantAction>;
      const action = custom.detail;

      if (!action) {
        return;
      }

      if (action.type === "toggle_reminder") {
        const match = items.find((item) => item.label.toLowerCase().includes(action.label.toLowerCase()));
        if (match) {
          void toggle(match.id);
        }
      }

      if (action.type === "add_reminder") {
        const createdItem: CheckItem = {
          id: `${Date.now()}`,
          label: action.label,
          time: action.time,
          done: false,
          icon: /water/i.test(action.label)
            ? "water"
            : /walk/i.test(action.label)
              ? "walk"
              : /med|pill|tablet/i.test(action.label)
                ? "pill"
                : "heart",
        };
        setItems((prev) => [...prev, createdItem]);
      }
    };

    window.addEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
    return () => window.removeEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-slate-100">Today&apos;s Timeline</h2>
          <p className="text-sm text-slate-400">Routine health moments, medication, and hydration checks.</p>
        </div>
        <button
          onClick={openSettings}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/35 bg-amber-400/10 text-amber-200 transition hover:bg-amber-400/20"
          aria-label="Manage Reminders"
          title="Manage Reminders"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl space-y-4 rounded-3xl border border-white/20 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading font-bold" style={{ color: "#E0E0E0" }}>Admin / Family Settings</h3>
              <Button variant="outline" onClick={closeSettings} className="h-[60px] px-5">Close</Button>
            </div>

            {!adminUnlocked ? (
              <div className="space-y-3">
                <p className="text-base" style={{ color: "#E0E0E0" }}>
                  Enter admin password to manage profiles and tasks.
                </p>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    type="password"
                    placeholder="Admin password"
                    value={adminPassInput}
                    onChange={(event) => setAdminPassInput(event.target.value)}
                    className="h-[60px]"
                  />
                  <Button onClick={unlockAdmin} className="h-[60px] px-6">Unlock</Button>
                </div>
                {adminError && <p className="text-sm text-red-300">{adminError}</p>}
              </div>
            ) : (
              <>
                <div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                  <Input
                    placeholder="Task name"
                    value={newItemLabel}
                    onChange={(event) => setNewItemLabel(event.target.value)}
                    className="h-[60px]"
                  />
                  <Input
                    placeholder="Time (e.g. 6:30 PM)"
                    value={newItemTime}
                    onChange={(event) => setNewItemTime(event.target.value)}
                    className="h-[60px]"
                  />
                  <Button onClick={addItem} className="h-[60px] px-5">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-200">Daily Completion</span>
          <span className="font-semibold text-amber-200">{completedCount}/{items.length} done</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/80">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        </div>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative"
          >
            <button
              onClick={() => toggle(item.id)}
              className={`w-full min-h-[74px] text-left rounded-2xl border p-4 transition-all ${
                item.done
                  ? "border-amber-300/35 bg-gradient-to-r from-amber-400/10 to-slate-900/70"
                  : "border-white/15 bg-slate-900/65 hover:border-cyan-200/35 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.done ? "bg-amber-300/20 text-amber-100" : "bg-cyan-400/10 text-cyan-100"}`}>
                  {iconByType[item.icon]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-semibold ${item.done ? "text-slate-300" : "text-slate-100"}`}>{item.label}</p>
                  <p className="text-sm text-slate-400">{item.time}</p>
                  {isMedicineTask(item) && (
                    <p className="text-xs text-amber-200/85">
                      Stock left: {medicineStock[item.id] ?? 30} tablets
                    </p>
                  )}
                </div>
                <span className="text-slate-300">{item.done ? <CheckCircle2 className="h-5 w-5 text-amber-200" /> : <Circle className="h-5 w-5" />}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.done ? "bg-amber-300/20 text-amber-100" : "bg-slate-700 text-slate-200"}`}>
                  {item.done ? "Done" : "Pending"}
                </span>
              </div>
            </button>

            {settingsOpen && adminUnlocked && (
              <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-2 md:grid-cols-[1fr_160px_auto]">
                <Input
                  value={item.label}
                  onChange={(event) => updateItem(item.id, "label", event.target.value)}
                  className="h-[60px]"
                />
                <Input
                  value={item.time}
                  onChange={(event) => updateItem(item.id, "time", event.target.value)}
                  className="h-[60px]"
                />
                <Button
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="h-[60px]"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground mr-2" />
                  Remove
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;
