import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import DashboardShell from "@/components/DashboardShell";
import { loadVitals, saveVitals, type VitalsRecord } from "@/lib/vitals";
import { Trash2 } from "lucide-react";

const HealthVitals = () => {
  const [records, setRecords] = useState<VitalsRecord[]>(() => loadVitals());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [systolic, setSystolic] = useState(125);
  const [diastolic, setDiastolic] = useState(80);
  const [sugar, setSugar] = useState(102);
  const [heartbeat, setHeartbeat] = useState(74);

  const chartData = useMemo(
    () => records.map((item) => ({ ...item, day: item.date.slice(5) })),
    [records],
  );

  const addRecord = () => {
    const next = [
      ...records,
      {
        id: `${Date.now()}`,
        date,
        systolic,
        diastolic,
        sugar,
        heartbeat,
      },
    ].sort((a, b) => a.date.localeCompare(b.date));

    setRecords(next);
    saveVitals(next);
  };

  const removeRecord = (id: string) => {
    const next = records.filter((item) => item.id !== id);
    setRecords(next);
    saveVitals(next);
  };

  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Health & Vitals</h2>
        <div className="grid gap-2 md:grid-cols-6">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-white/15 bg-slate-800 p-2 text-sm" />
          <input type="number" value={systolic} onChange={(e) => setSystolic(Number(e.target.value))} placeholder="Systolic" className="rounded-lg border border-white/15 bg-slate-800 p-2 text-sm" />
          <input type="number" value={diastolic} onChange={(e) => setDiastolic(Number(e.target.value))} placeholder="Diastolic" className="rounded-lg border border-white/15 bg-slate-800 p-2 text-sm" />
          <input type="number" value={sugar} onChange={(e) => setSugar(Number(e.target.value))} placeholder="Sugar" className="rounded-lg border border-white/15 bg-slate-800 p-2 text-sm" />
          <input type="number" value={heartbeat} onChange={(e) => setHeartbeat(Number(e.target.value))} placeholder="Heartbeat" className="rounded-lg border border-white/15 bg-slate-800 p-2 text-sm" />
          <button onClick={addRecord} className="rounded-lg bg-cyan-500/20 p-2 text-sm font-semibold text-cyan-100">Add</button>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-3 lg:col-span-2">
            <p className="mb-2 text-sm text-slate-300">Blood Pressure Trend</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#fbbf24" strokeWidth={3} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-3">
            <p className="mb-2 text-sm text-slate-300">Sugar / Heartbeat</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="sugar" stroke="#a78bfa" strokeWidth={3} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="heartbeat" stroke="#60a5fa" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {records.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
              <p>
                {item.date} | BP {item.systolic}/{item.diastolic} | Sugar {item.sugar} | Heartbeat {item.heartbeat}
              </p>
              <button onClick={() => removeRecord(item.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300/30 bg-red-500/15 text-red-200">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
};

export default HealthVitals;
