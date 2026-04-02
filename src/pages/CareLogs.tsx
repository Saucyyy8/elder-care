import DashboardShell from "@/components/DashboardShell";
import LocationLog from "@/components/LocationLog";

const CareLogs = () => {
  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Care Logs & Files</h2>
        <LocationLog />
      </div>
    </DashboardShell>
  );
};

export default CareLogs;
