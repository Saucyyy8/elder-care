import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { loadMemories, saveMemories, type MemoryItem } from "@/lib/memoriesStore";

const Memories = () => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const loaded = await loadMemories();
      setItems(loaded);
    };

    void hydrate();
  }, []);

  const persist = async (next: MemoryItem[]) => {
    setItems(next);
    try {
      await saveMemories(next);
      setSaveError(null);
    } catch {
      setSaveError("Could not persist memories. Please try a smaller image.");
    }
  };

  const onPickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const addMemory = () => {
    if (!selectedImage || !location.trim() || !date) {
      return;
    }

    const next: MemoryItem[] = [
      {
        id: `${Date.now()}`,
        imageData: selectedImage,
        location: location.trim(),
        date,
        note: note.trim(),
      },
      ...items,
    ];

    void persist(next);
    setSelectedImage("");
    setLocation("");
    setNote("");
  };

  const removeMemory = (id: string) => {
    void persist(items.filter((item) => item.id !== id));
  };

  return (
    <DashboardShell>
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="text-xl font-semibold text-slate-100">Memories</h2>
        <p className="mt-1 text-sm text-slate-300">Store family pictures with location and date for easy recall.</p>
        {saveError && <p className="mt-2 text-xs text-amber-200">{saveError}</p>}

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          <label className="col-span-2 flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-200">
            <ImagePlus className="h-4 w-4" />
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-100"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-800 px-3 text-sm text-slate-100"
          />
          <button onClick={addMemory} className="rounded-lg bg-cyan-500/25 px-3 text-sm font-semibold text-cyan-100">
            Save Memory
          </button>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="mt-2 w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-100"
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60">
              <img src={item.imageData} alt="Memory" className="h-48 w-full object-cover" />
              <div className="space-y-1 p-3 text-sm text-slate-200">
                <p><span className="text-slate-400">Location:</span> {item.location}</p>
                <p><span className="text-slate-400">Date:</span> {item.date}</p>
                {item.note && <p><span className="text-slate-400">Note:</span> {item.note}</p>}
                <button
                  onClick={() => removeMemory(item.id)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-300/30 bg-red-500/15 px-2 py-1 text-xs text-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
};

export default Memories;
