import DashboardShell from "@/components/DashboardShell";
import DailyChecklist from "@/components/DailyChecklist";

const TimelineReminders = () => {
  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Timeline & Reminders</h2>
        <DailyChecklist />
      </div>
    </DashboardShell>
  );
};

export default TimelineReminders;
