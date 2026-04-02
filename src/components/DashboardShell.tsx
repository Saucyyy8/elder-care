import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CompanionChat from "@/components/CompanionChat";
import {
  Bell,
  ClipboardList,
  FileText,
  HeartPulse,
  Image,
  LayoutDashboard,
  LogOut,
  MapPin,
  Mic,
  Pill,
  Settings,
  Users,
  Stethoscope,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
}

interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface ChecklistReminderItem {
  id: string;
  label: string;
  time: string;
  done: boolean;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Timeline & Reminders", icon: ClipboardList, path: "/dashboard/timeline" },
  { label: "Location & Map", icon: MapPin, path: "/dashboard/location" },
  { label: "Health & Vitals", icon: HeartPulse, path: "/dashboard/vitals" },
  { label: "Contacts & Support", icon: Users, path: "/dashboard/contacts" },
  { label: "Care Logs & Files", icon: FileText, path: "/dashboard/logs" },
  { label: "Medication Inventory", icon: Pill, path: "/dashboard/inventory" },
  { label: "Memories", icon: Image, path: "/dashboard/memories" },
  { label: "Doctor Vault", icon: Stethoscope, path: "/dashboard/doctor-vault" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const CHECKLIST_STORAGE_KEY = "guardianChecklistPrimary";

const formatTimeForReminderMatch = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatCurrentDateTime = (date: Date) =>
  date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getSectionTitle = (path: string) => {
  const match = navItems.find((item) => item.path === path);
  return match ? match.label : "Dashboard";
};

const DashboardShell = ({ children }: DashboardShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem("authUserName") || "Resident";
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifiedReminderKeysRef = useRef<Set<string>>(new Set());

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => {
        console.error("Notification permission request failed", error);
      });
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (!raw) {
        return;
      }

      let reminders: ChecklistReminderItem[] = [];
      try {
        reminders = JSON.parse(raw) as ChecklistReminderItem[];
      } catch {
        return;
      }

      const nowDate = new Date();
      const nowLabel = formatTimeForReminderMatch(nowDate);
      const dateKey = nowDate.toISOString().slice(0, 10);

      reminders
        .filter((item) => !item.done)
        .filter((item) => item.time.trim().toUpperCase() === nowLabel.toUpperCase())
        .forEach((item) => {
          const reminderKey = `${dateKey}:${item.id}`;
          if (notifiedReminderKeysRef.current.has(reminderKey)) {
            return;
          }

          notifiedReminderKeysRef.current.add(reminderKey);
          const title = "Reminder Due Now";
          const body = `${item.label} (${item.time})`;

          setNotifications((prev) => [
            {
              id: `${Date.now()}-${item.id}`,
              title,
              body,
              createdAt: formatCurrentDateTime(new Date()),
              read: false,
            },
            ...prev,
          ]);

          if (window.Notification && Notification.permission === "granted") {
            new Notification(title, { body });
          }
        });
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (!prev) {
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      }
      return next;
    });
  };

  const assistantContext = useMemo(
    () => ({
      userName,
      safetyStatus: "all-good" as const,
      safetySummary: "All systems stable.",
      checklistProfileName: userName,
      checklistItems: [],
      familyUpdates: [],
    }),
    [userName],
  );

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUserName");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050c16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-[22rem] w-[22rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[30rem] w-[30rem] rounded-full bg-amber-300/8 blur-3xl" />
      </div>

      <header className="relative border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-slate-900/70 px-4 py-1.5 text-slate-200">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 text-[10px] font-bold text-blue-100">G</span>
            {getSectionTitle(location.pathname)}
          </div>

          <div className="relative flex items-center gap-3">
            <p className="tracking-[0.08em] text-slate-300">{formatCurrentDateTime(now)}</p>
            <button
              onClick={toggleNotifications}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-200"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-white/20 bg-slate-900 p-3 shadow-xl">
                <p className="mb-2 text-sm font-semibold text-white">Notifications</p>
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
          </div>
        </div>
      </header>

      <main className="container relative py-5 lg:py-6">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b1830] to-[#091423] p-4 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.12)]">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-600/35 text-sm font-bold text-cyan-50">
                P
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{userName}</p>
                <p className="truncate text-xs text-slate-400">Logged in as {userName}</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm transition ${
                      active
                        ? "border border-blue-300/35 bg-gradient-to-r from-blue-500/30 to-cyan-500/15 text-blue-100"
                        : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 space-y-2 rounded-2xl border border-amber-300/20 bg-slate-900/70 p-3">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="inline-flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-500/15 px-3 text-sm font-medium text-cyan-100"
              >
                <Mic className="h-4 w-4" />
                Speak to Assistant
              </button>
              <button className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-red-300/40 bg-red-500/15 text-sm font-semibold text-red-100">
                SOS Quick Trigger
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </aside>

          <section className="space-y-5">{children}</section>
        </div>
      </main>

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/20 bg-slate-950/95 p-4 flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-heading font-bold text-slate-100">Assistant</h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="inline-flex min-h-[48px] items-center rounded-xl border border-white/20 px-4 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-cyan-200/30 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
              <CompanionChat context={assistantContext} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardShell;
