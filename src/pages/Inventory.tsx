import DashboardShell from "@/components/DashboardShell";
import MedicationStockManager from "@/components/MedicationStockManager";

const Inventory = () => {
  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <MedicationStockManager />
      </div>
    </DashboardShell>
  );
};

export default Inventory;
