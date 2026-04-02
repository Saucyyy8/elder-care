import DashboardShell from "@/components/DashboardShell";
import FallDetectionVideo from "@/components/FallDetectionVideo";
import LocationLog from "@/components/LocationLog";
import LocationTracker from "@/components/LocationTracker";

const LocationMap = () => {
  return (
    <DashboardShell>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <LocationTracker />
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <LocationLog />
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <FallDetectionVideo />
      </div>
    </DashboardShell>
  );
};

export default LocationMap;
