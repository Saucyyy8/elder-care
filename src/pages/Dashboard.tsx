import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardShell from "@/components/DashboardShell";
import SOSButton from "@/components/SOSButton";
import FallDetectionVideo from "@/components/FallDetectionVideo";
import { MapPin, ShieldCheck } from "lucide-react";
import { loadVitals } from "@/lib/vitals";

const activityData = [
  { name: "Walking", minutes: 86, fill: "#2dd4bf" },
  { name: "Sitting", minutes: 128, fill: "#3b82f6" },
  { name: "Resting", minutes: 62, fill: "#fbbf24" },
];

const Dashboard = () => {
  const vitals = useMemo(() => loadVitals(), []);
  const bpTrend = vitals.map((item) => ({
    day: item.date.slice(5),
    systolic: item.systolic,
    diastolic: item.diastolic,
  }));

  return (
    <DashboardShell>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-blue-900/50 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Care Hub</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">Pallab&apos;s Care Hub Dashboard: Good Morning.</h1>
        <p className="mt-1 text-slate-300">Summary: All checks complete. Stay safe.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <article className="rounded-3xl border border-red-300/30 bg-gradient-to-b from-red-600/15 to-slate-900/80 p-5 shadow-[0_0_35px_rgba(239,68,68,0.28)]">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Emergency Control</h2>
            <SOSButton />
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-100">OpenCV Fall Detection</h3>
            <FallDetectionVideo />
          </article>
        </div>

        <div className="space-y-5">
          <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Daily Activity Chart</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <Tooltip />
                  <Bar dataKey="minutes" radius={[8, 8, 8, 8]}>
                    {activityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Blood Pressure Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#fbbf24" strokeWidth={3} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-200" />
                <h4 className="text-sm font-semibold text-slate-100">Current Location</h4>
              </div>
              <p className="text-lg font-semibold text-cyan-100">Room 301 - Stable</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                <h4 className="text-sm font-semibold text-slate-100">Fall Detection</h4>
              </div>
              <p className="text-lg font-semibold text-emerald-100">Monitoring - Stable</p>
            </article>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
