import DashboardShell from "@/components/DashboardShell";

const DashboardSettings = () => {
  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="text-xl font-semibold text-slate-100">Settings</h2>
        <p className="mt-2 text-slate-300">Configure caregiver preferences, alert channels, and dashboard defaults.</p>
      </div>
    </DashboardShell>
  );
};

export default DashboardSettings;
