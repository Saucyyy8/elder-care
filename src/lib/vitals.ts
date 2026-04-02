export interface VitalsRecord {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  sugar: number;
  heartbeat: number;
}

export const VITALS_STORAGE_KEY = "guardianVitalsRecords";

export const defaultVitalsRecords: VitalsRecord[] = [
  { id: "v1", date: "2026-03-04", systolic: 134, diastolic: 86, sugar: 118, heartbeat: 78 },
  { id: "v2", date: "2026-03-09", systolic: 132, diastolic: 84, sugar: 112, heartbeat: 76 },
  { id: "v3", date: "2026-03-14", systolic: 129, diastolic: 82, sugar: 109, heartbeat: 75 },
  { id: "v4", date: "2026-03-19", systolic: 128, diastolic: 80, sugar: 106, heartbeat: 74 },
  { id: "v5", date: "2026-03-24", systolic: 126, diastolic: 79, sugar: 104, heartbeat: 73 },
  { id: "v6", date: "2026-03-29", systolic: 124, diastolic: 77, sugar: 101, heartbeat: 72 },
  { id: "v7", date: "2026-04-02", systolic: 123, diastolic: 76, sugar: 99, heartbeat: 71 },
];

export const loadVitals = (): VitalsRecord[] => {
  try {
    const raw = localStorage.getItem(VITALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(defaultVitalsRecords));
      return defaultVitalsRecords;
    }

    const parsed = JSON.parse(raw) as VitalsRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(defaultVitalsRecords));
      return defaultVitalsRecords;
    }

    return parsed;
  } catch {
    localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(defaultVitalsRecords));
    return defaultVitalsRecords;
  }
};

export const saveVitals = (records: VitalsRecord[]) => {
  localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(records));
};
