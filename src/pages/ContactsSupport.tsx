import DashboardShell from "@/components/DashboardShell";
import RelativeEmailManager from "@/components/RelativeEmailManager";

const ContactsSupport = () => {
  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="mb-3 text-xl font-semibold text-slate-100">Contacts & Support</h2>
        <RelativeEmailManager />
      </div>
    </DashboardShell>
  );
};

export default ContactsSupport;
