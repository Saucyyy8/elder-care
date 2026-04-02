import { useMemo, useState } from "react";
import ActivityMonitor from "@/components/ActivityMonitor";
import DailyChecklist from "@/components/DailyChecklist";
import RelativeEmailManager from "@/components/RelativeEmailManager";
import SOSButton from "@/components/SOSButton";
import CompanionChat from "@/components/CompanionChat";
import LocationTracker from "@/components/LocationTracker";
import LocationLog from "@/components/LocationLog";
import { AlertTriangle, Bell, LogOut, MessageCircleHeart, Siren, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface ChecklistSnapshotItem {
  id: string;
  label: string;
  time: string;
  done: boolean;
}

interface ChecklistSnapshot {
  profileName: string;
  items: ChecklistSnapshotItem[];
}

interface FamilyContactSummary {
  name: string;
  relation: string;
}

const parseReminderTime = (timeLabel: string): Date | null => {
  const trimmed = timeLabel.trim();
  if (/throughout/i.test(trimmed)) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) {
    return null;
  }

  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  const meridian = match[3].toUpperCase();
  if (hourRaw < 1 || hourRaw > 12 || minute < 0 || minute > 59) {
    return null;
  }

  let hour24 = hourRaw % 12;
  if (meridian === "PM") {
    hour24 += 12;
  }

  const date = new Date();
  date.setHours(hour24, minute, 0, 0);
  return date;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("authUserName") || "Resident";
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSosEmergency, setIsSosEmergency] = useState(false);
  const [checklistSnapshot, setChecklistSnapshot] = useState<ChecklistSnapshot | null>(null);
  const [familyContacts, setFamilyContacts] = useState<FamilyContactSummary[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const statusConfig = useMemo(() => {
    if (isSosEmergency) {
      return {
        level: "emergency" as const,
        title: `${userName}, this is an emergency. Help is being contacted now.`,
        subtitle: "Stay calm. Keep the phone close. Emergency support is active.",
      };
    }

    if (!checklistSnapshot || checklistSnapshot.items.length === 0) {
      return {
        level: "good" as const,
        title: "Everything is looking great today.",
        subtitle: "You are all set for now.",
      };
    }

    const now = new Date();
    const missed = checklistSnapshot.items
      .filter((item) => !item.done)
      .map((item) => ({ item, reminderDate: parseReminderTime(item.time) }))
      .filter((entry): entry is { item: ChecklistSnapshotItem; reminderDate: Date } => Boolean(entry.reminderDate))
      .filter((entry) => entry.reminderDate.getTime() < now.getTime())
      .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());

    if (missed.length === 0) {
      return {
        level: "good" as const,
        title: "Everything is looking great today.",
        subtitle: `${checklistSnapshot.profileName}'s reminders are up to date.`,
      };
    }

    const firstMissed = missed[0].item;
    return {
      level: "warning" as const,
      title: `${checklistSnapshot.profileName}, it's time for your ${firstMissed.label}.`,
      subtitle: `You missed the ${firstMissed.time} reminder. Shall I remind you again in 5 minutes?`,
    };
  }, [checklistSnapshot, isSosEmergency, userName]);

  const statusClasses =
    statusConfig.level === "emergency"
      ? "border-red-300/50 bg-red-400/30"
      : statusConfig.level === "warning"
        ? "border-amber-300/50 bg-amber-300/30"
        : "border-cyan-300/50 bg-cyan-300/30";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserName");
    navigate("/login");
  };

  const handleReminderNotification = (payload: {
    title: string;
    body: string;
    profileName: string;
    itemLabel: string;
    timeLabel: string;
  }) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}`,
        title: payload.title,
        body: payload.body,
        createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        read: false,
      },
      ...prev,
    ]);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (!prev) {
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      }
      return next;
    });
  };

  const assistantContext = useMemo(() => {
    const safetyLevel = isSosEmergency
      ? "emergency"
      : statusConfig.level === "warning"
        ? "missed-task"
        : "all-good";

    return {
      userName,
      safetyStatus: safetyLevel as "all-good" | "missed-task" | "emergency",
      safetySummary: statusConfig.subtitle,
      checklistProfileName: checklistSnapshot?.profileName || userName,
      checklistItems: checklistSnapshot?.items || [],
      familyUpdates: familyContacts.map((contact) => `${contact.name} (${contact.relation})`),
    };
  }, [checklistSnapshot, familyContacts, isSosEmergency, statusConfig.level, statusConfig.subtitle, userName]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-foreground [&_button]:min-h-[60px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:18px_18px]" />
      </div>

      <header className="relative border-b border-white/15 bg-slate-900/75 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-white">Guardian Companion Dashboard</h1>
            <p className="text-sm text-slate-300">Logged in as {userName}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <button
              onClick={toggleNotifications}
              className="relative inline-flex h-[60px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-white">{unreadCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-20 w-80 rounded-xl border border-white/20 bg-slate-900 p-3 shadow-xl">
                <p className="mb-2 text-sm font-semibold text-white">Reminder Notifications</p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-300">No notifications yet.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-white/20 bg-slate-800/70 p-2">
                        <p className="text-sm font-semibold text-white">{notification.title}</p>
                        <p className="text-sm text-slate-300">{notification.body}</p>
                        <p className="mt-1 text-xs text-slate-400">{notification.createdAt}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex h-[60px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container relative space-y-6 py-6">
        <section className={`rounded-2xl border p-6 shadow-lg ${statusClasses}`}>
          <div className="flex items-start gap-3">
            {statusConfig.level === "warning" && <AlertTriangle className="mt-1 h-6 w-6 text-amber-50" />}
            {statusConfig.level === "emergency" && <Siren className="mt-1 h-6 w-6 text-red-50" />}
            <div>
              <p className="text-2xl font-heading font-black md:text-3xl" style={{ color: "#E0E0E0" }}>
                {statusConfig.title}
              </p>
              <p className="mt-1 text-lg" style={{ color: "#E0E0E0" }}>{statusConfig.subtitle}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-emerald-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
            <DailyChecklist
              onReminderNotification={handleReminderNotification}
              onChecklistSnapshot={(snapshot) => setChecklistSnapshot(snapshot)}
            />
          </div>
          <div className="rounded-2xl border border-orange-300/40 bg-orange-100/15 p-5 shadow-xl backdrop-blur">
            <SOSButton onEmergencyStateChange={setIsSosEmergency} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-6">
          <div className="rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
            <LocationTracker />
          </div>
          <div className="rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
            <LocationLog onSosTrigger={() => {
              setIsSosEmergency(true);
              handleReminderNotification({
                title: "Auto SOS from Room 302",
                body: "Resident has been in Room 302 for over 10 minutes. Emergency contacts notified.",
                profileName: userName,
                itemLabel: "Room 302 Safety Alarm",
                timeLabel: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
              });
            }} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
            <ActivityMonitor />
          </div>
          <div className="rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
            <RelativeEmailManager onContactsChange={setFamilyContacts} />
          </div>
        </section>
      </main>

      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex min-h-[60px] items-center gap-3 rounded-full border border-cyan-200/40 bg-cyan-400/25 px-6 py-3 text-base font-semibold text-white shadow-xl backdrop-blur-md hover:bg-cyan-300/30"
      >
        <MessageCircleHeart className="h-5 w-5" />
        Open Assistant
      </button>

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/20 bg-slate-950/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-heading font-bold" style={{ color: "#E0E0E0" }}>Help & Chat</h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="inline-flex min-h-[60px] items-center rounded-xl border border-white/20 px-4 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
              <CompanionChat context={assistantContext} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
