import { Bell, BatteryFull, Plus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const medicationItems = [
  {
    id: "evening",
    label: "Evening Medicine (Cholesterol)",
    detail: "12 Tablets Left (Low - Reorder Soon!)",
    percent: 20,
    low: true,
  },
  {
    id: "morning",
    label: "Morning Medicine (Blood Pressure)",
    detail: "45 Tablets Left",
    percent: 75,
    low: false,
  },
];

const MedicationStockManager = () => {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inventory</p>
          <h3 className="mt-1 text-xl font-heading font-semibold text-slate-100">Medication Stock & Alerts</h3>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.35)]">
          <Bell className="h-5 w-5" />
        </span>
      </div>

      <div className="space-y-4">
        {medicationItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-2xl border border-white/10 bg-slate-900/75 p-4"
          >
            <p className="text-sm font-medium text-slate-100">{item.label}</p>
            <p className={`mt-1 text-sm ${item.low ? "text-amber-200" : "text-teal-200"}`}>{item.detail}</p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-700/80">
              <div
                className={`h-full rounded-full ${item.low ? "bg-gradient-to-r from-amber-400 to-amber-200" : "bg-gradient-to-r from-teal-500 to-cyan-300"}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{item.percent}%</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-teal-300/20 bg-slate-900/75 p-4">
        <p className="flex items-center gap-2 text-sm text-teal-100">
          <BatteryFull className="h-4 w-4" />
          Blood Pressure Monitor Batteries: Good.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25">
          <RefreshCw className="h-4 w-4" />
          Update Count
        </button>
        <button className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800 px-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-700">
          <Plus className="h-4 w-4" />
          New Medication
        </button>
      </div>
    </div>
  );
};

export default MedicationStockManager;
