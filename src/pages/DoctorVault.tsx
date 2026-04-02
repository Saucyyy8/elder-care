import { useEffect, useState } from "react";
import { FilePlus2, Trash2 } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";

interface DoctorDoc {
  id: string;
  doctorName: string;
  reportDate: string;
  nextAppointment: string;
  fileName: string;
  fileData: string;
}

const STORAGE_KEY = "guardianDoctorVault";

const DoctorVault = () => {
  const [docs, setDocs] = useState<DoctorDoc[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextAppointment, setNextAppointment] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      setDocs(JSON.parse(raw) as DoctorDoc[]);
    } catch {
      setDocs([]);
    }
  }, []);

  const persist = (next: DoctorDoc[]) => {
    setDocs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(String(reader.result || ""));
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const addDoc = () => {
    if (!doctorName.trim() || !reportDate || !nextAppointment || !fileData) {
      return;
    }

    const next: DoctorDoc[] = [
      {
        id: `${Date.now()}`,
        doctorName: doctorName.trim(),
        reportDate,
        nextAppointment,
        fileName,
        fileData,
      },
      ...docs,
    ];
    persist(next);

    setDoctorName("");
    setNextAppointment("");
    setFileData("");
    setFileName("");
  };

  const removeDoc = (id: string) => {
    persist(docs.filter((doc) => doc.id !== id));
  };

  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="text-xl font-semibold text-slate-100">Doctor Document Vault</h2>
        <p className="mt-1 text-sm text-slate-300">Store prescriptions and lab reports with doctor and appointment tracking.</p>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          <input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="Doctor Name"
            className="rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-100"
          />
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-100"
          />
          <input
            type="date"
            value={nextAppointment}
            onChange={(e) => setNextAppointment(e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-100"
          />
          <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-200">
            <FilePlus2 className="h-4 w-4" /> Upload File
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={onPickFile} />
          </label>
          <button onClick={addDoc} className="rounded-lg bg-cyan-500/25 px-3 text-sm font-semibold text-cyan-100">Save Doc</button>
        </div>

        <div className="mt-5 space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 p-3 text-sm text-slate-200">
              <p className="min-w-[140px]"><span className="text-slate-400">Doctor:</span> {doc.doctorName}</p>
              <p className="min-w-[130px]"><span className="text-slate-400">Report:</span> {doc.reportDate}</p>
              <p className="min-w-[170px]"><span className="text-slate-400">Next Appointment:</span> {doc.nextAppointment}</p>
              <a
                href={doc.fileData}
                download={doc.fileName}
                className="rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-2 py-1 text-xs text-cyan-100"
              >
                {doc.fileName || "Download"}
              </a>
              <button
                onClick={() => removeDoc(doc.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-300/30 bg-red-500/15 px-2 py-1 text-xs text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
};

export default DoctorVault;
