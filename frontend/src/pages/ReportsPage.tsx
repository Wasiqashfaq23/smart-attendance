import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader, Printer, Pencil, Trash2, X, Save } from "lucide-react";
import * as api from "../utils/api";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DAY_LABEL: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday",
};
const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri",
};

type Tab = "master" | "combined" | "teachers" | "classes";

// ── Edit Modal ─────────────────────────────────────────────────────
function EditModal({
  entry, teachers, subjects, classes, onSave, onDelete, onClose,
}: {
  entry: any; teachers: any[]; subjects: any[]; classes: any[];
  onSave: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const [subjectId, setSubjectId] = useState<number>(entry.subject_id);
  const [teacherId, setTeacherId] = useState<number | "">(entry.teacher_id ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(entry.id, { subject_id: subjectId, teacher_id: teacherId || null });
    setSaving(false);
    onClose();
  };
  const handleDelete = async () => {
    await onDelete(entry.id);
    onClose();
  };

  const cls = classes.find((c: any) => c.id === entry.class_id);
  const dayLabel = DAY_LABEL[entry.day] || entry.day;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Edit Timetable Entry</h2>
        <p className="text-sm text-slate-500 mb-5">
          {cls?.name} · {dayLabel} · Period slot
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : "")}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No teacher (Assembly) —</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} /> Delete entry
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Confirm delete?</span>
              <button onClick={handleDelete} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Editable cell ──────────────────────────────────────────────────
function Cell({
  entry, period, isAssembly, isBreak, cellBg, children, onEdit,
}: {
  entry?: any; period: any; isAssembly: boolean; isBreak: boolean;
  cellBg: string; children: React.ReactNode; onEdit: (e: any) => void;
}) {
  if (isBreak) {
    return (
      <td className="border border-slate-300 py-1.5 px-1 text-center bg-amber-50 text-amber-600 font-semibold text-xs align-middle">
        Break
      </td>
    );
  }
  if (isAssembly) {
    return (
      <td className="border border-slate-300 py-1.5 px-1 text-center bg-purple-50 text-purple-700 font-semibold text-xs align-middle">
        Assembly
      </td>
    );
  }
  return (
    <td className={`border border-slate-300 py-1 px-1 text-center align-middle group relative ${cellBg}`}>
      {entry ? (
        <div className="relative">
          {children}
          <button
            onClick={() => onEdit(entry)}
            className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 z-10"
            title="Edit"
          >
            <Pencil size={10} />
          </button>
        </div>
      ) : (
        <span className="text-slate-300 text-xs">—</span>
      )}
    </td>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("master");
  const [editEntry, setEditEntry] = useState<any>(null);
  const qc = useQueryClient();

  const { data: rawTimetable = [], isLoading } = useQuery({ queryKey: ["timetable"], queryFn: api.getTimetable });
  const { data: rawTeachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: api.getTeachers });
  const { data: rawClasses = [] } = useQuery({ queryKey: ["classes"], queryFn: api.getClasses });
  const { data: rawSubjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: api.getSubjects });
  const { data: rawPeriods = [] } = useQuery({ queryKey: ["periods"], queryFn: api.getPeriods });

  const timetable = Array.isArray(rawTimetable) ? rawTimetable : [];
  const teachers = Array.isArray(rawTeachers) ? rawTeachers : [];
  const classes = Array.isArray(rawClasses) ? rawClasses : [];
  const subjects = Array.isArray(rawSubjects) ? rawSubjects : [];
  const periods = Array.isArray(rawPeriods) ? rawPeriods : [];

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader className="animate-spin" /></div>;

  const teacherMap: Record<number, any> = Object.fromEntries(teachers.map((t: any) => [t.id, t]));
  const classMap: Record<number, any> = Object.fromEntries(classes.map((c: any) => [c.id, c]));
  const subjectMap: Record<number, any> = Object.fromEntries(subjects.map((s: any) => [s.id, s]));

  const monThuPeriods: any[] = periods
    .filter((p: any) => p.applicable_day_type === "mon_thu")
    .sort((a: any, b: any) => a.period_number - b.period_number);
  const fridayPeriods: any[] = periods
    .filter((p: any) => p.applicable_day_type === "friday")
    .sort((a: any, b: any) => a.period_number - b.period_number);

  const fmt = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")}${ap}`;
  };

  const pLabel = (n: number) => n === 0 ? "Assembly" : n === 4 ? "Break" : `${n}`;
  const pTime = (p: any) => `${fmt(p.start_time)}–${fmt(p.end_time)}`;

  // ── API mutations ────────────────────────────────────────────────
  const handleSave = async (id: number, data: any) => {
    await api.updateTimetable(id, data);
    qc.invalidateQueries({ queryKey: ["timetable"] });
  };
  const handleDelete = async (id: number) => {
    await api.deleteTimetable(id);
    qc.invalidateQueries({ queryKey: ["timetable"] });
  };

  // ── Shared column header ─────────────────────────────────────────
  const renderHead = (periodList: any[], dark = false) => (
    <tr className={dark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"}>
      <th className={`border ${dark ? "border-slate-600" : "border-slate-300"} py-2 px-3 text-left font-semibold text-xs min-w-28`}>
        Class
      </th>
      {periodList.map((p: any) => (
        <th key={p.id} className={`border ${dark ? "border-slate-600" : "border-slate-300"} py-1.5 px-1 text-center font-semibold text-xs min-w-[88px]
          ${p.period_number === 0 ? (dark ? "bg-purple-900" : "bg-purple-100")
            : p.period_number === 4 ? (dark ? "bg-amber-800" : "bg-amber-100")
            : ""}`}>
          <div>{pLabel(p.period_number)}</div>
          <div className={`font-normal text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>{pTime(p)}</div>
        </th>
      ))}
    </tr>
  );

  // ── One row in combined/class table ─────────────────────────────
  const renderClassRow = (cls: any, day: string, periodList: any[], idx: number) => {
    const bg = idx % 2 === 0 ? "" : "bg-slate-50";
    return (
      <tr key={`${cls.id}-${day}`} className={`${bg} hover:bg-blue-50`}>
        <td className="border border-slate-300 py-2 px-3 font-bold text-slate-800 bg-slate-100 text-xs">
          {cls.name}
          <div className="text-slate-500 font-normal">{cls.program}</div>
        </td>
        {periodList.map((p: any) => {
          const isAssembly = p.period_number === 0;
          const isBreak = p.period_number === 4;
          const entry = (!isAssembly && !isBreak)
            ? (timetable as any[]).find((t: any) => t.class_id === cls.id && t.day === day && t.period_id === p.id)
            : undefined;
          return (
            <Cell key={p.id} entry={entry} period={p} isAssembly={isAssembly} isBreak={isBreak}
              cellBg="" onEdit={setEditEntry}>
              {entry && (
                <div className="text-xs leading-tight py-0.5">
                  <div className="font-bold text-slate-800">{subjectMap[entry.subject_id]?.name || "—"}</div>
                  <div className="text-slate-500">{entry.teacher_id ? teacherMap[entry.teacher_id]?.name : ""}</div>
                </div>
              )}
            </Cell>
          );
        })}
      </tr>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // MASTER TABLE — exact replica of reference image
  // Single table: row per class, columns = periods
  // Header shows both Mon-Thu AND Friday times stacked
  // Break column spells B-R-E-A-K across the 7 class rows
  // ════════════════════════════════════════════════════════════════
  const BREAK_LETTERS = ["B", "R", "E", "A", "K", "–", "–"];

  // Teacher incharge per class (from reference image)
  const CLASS_INCHARGE: Record<string, string> = {
    "B1": "Ms. Arshia",
    "B2": "Ms. Noor",
    "B3": "Ms. Maheen",
    "A1": "Ms. Tayyaba",
    "A2": "Ms. Nousheen",
    "A3": "Ms. Rashida",
    "IX": "Ms. Numaira",
  };

  const renderMaster = () => {
    // Teaching periods only (no assembly P0, no break P4)
    const teachingMT = monThuPeriods.filter((p: any) => p.period_number !== 0 && p.period_number !== 4);
    const teachingFri = fridayPeriods.filter((p: any) => p.period_number !== 0 && p.period_number !== 4);
    const assemblyMT = monThuPeriods.find((p: any) => p.period_number === 0);
    const breakMT = monThuPeriods.find((p: any) => p.period_number === 4);
    const assemblyFri = fridayPeriods.find((p: any) => p.period_number === 0);
    const breakFri = fridayPeriods.find((p: any) => p.period_number === 4);

    // Combine: Assembly | P1 | P2 | P3 | Break | P5 | P6 | P7 | P8
    const allCols = [
      { key: "assembly", label: "Assembly", mt: assemblyMT, fri: assemblyFri },
      ...teachingMT.slice(0, 3).map((p: any, i: number) => ({
        key: `p${p.period_number}`, label: `${p.period_number}`,
        mt: p, fri: teachingFri[i],
      })),
      { key: "break", label: "Break", mt: breakMT, fri: breakFri },
      ...teachingMT.slice(3).map((p: any, i: number) => ({
        key: `p${p.period_number}`, label: `${p.period_number}`,
        mt: p, fri: teachingFri[i + 3],
      })),
    ];

    // Get timetable entry for a class on a given "day group" and period
    // dayGroup: "mon_thu" uses monday as representative, "friday" uses friday
    const getEntry = (classId: number, day: string, periodId: number | undefined) => {
      if (!periodId) return undefined;
      return (timetable as any[]).find((t: any) => t.class_id === classId && t.day === day && t.period_id === periodId);
    };

    // Build cell content: show Mon-Thu entry / Friday entry stacked
    const renderMasterCell = (cls: any, col: any, rowIdx: number) => {
      if (col.key === "assembly") {
        return (
          <td key={col.key} className="border border-slate-400 py-1 px-1 text-center bg-purple-50 align-top text-xs">
            <div className="font-semibold text-purple-800 leading-tight">Assembly/</div>
            <div className="font-semibold text-purple-800 leading-tight">Dengue</div>
            <div className="text-purple-700 leading-tight">Awareness</div>
          </td>
        );
      }
      if (col.key === "break") {
        return (
          <td key={col.key} className="border border-slate-400 py-1 px-1 text-center bg-amber-50 align-middle">
            <span className="font-bold text-amber-700 text-sm">{BREAK_LETTERS[rowIdx] || "—"}</span>
          </td>
        );
      }

      const mtEntry  = getEntry(cls.id, "monday", col.mt?.id);

      const renderEntry = (entry: any) => {
        if (!entry) return null;
        const subj = subjectMap[entry.subject_id]?.name || "—";
        const tchr = entry.teacher_id ? (teacherMap[entry.teacher_id]?.name || "") : "";
        return (
          <div className="rounded p-0.5 mb-0.5 relative group">
            <div className="font-bold text-slate-800 leading-tight">{subj}</div>
            {tchr && <div className="text-slate-600 leading-tight">{tchr}</div>}
            <div className="text-slate-400 leading-tight">(1-5)</div>
            <button onClick={() => setEditEntry(entry)}
              className="absolute -top-0.5 -right-0.5 hidden group-hover:flex w-4 h-4 bg-blue-500 text-white rounded-full items-center justify-center z-10"
              title="Edit"><Pencil size={8} /></button>
          </div>
        );
      };

      return (
        <td key={col.key} className="border border-slate-400 py-1 px-1 align-top text-xs min-w-[90px]">
          {mtEntry ? renderEntry(mtEntry) : <span className="text-slate-300">—</span>}
        </td>
      );
    };

    return (
      <div className="card print:shadow-none">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">Master Timetable</h3>
            <p className="text-xs text-slate-500 mt-0.5">All classes · All periods · Monday–Thursday schedule</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              {/* Row 1: Period numbers */}
              <tr className="bg-slate-800 text-white">
                <th className="border border-slate-600 py-2 px-2 text-left font-bold min-w-28" rowSpan={2}>
                  PERIODS
                </th>
                {allCols.map((col) => (
                  <th key={col.key}
                    className={`border border-slate-600 py-1.5 px-1 text-center font-bold min-w-[90px]
                      ${col.key === "assembly" ? "bg-purple-900" : col.key === "break" ? "bg-amber-800" : "bg-slate-800"}`}>
                    {col.key === "assembly" ? "" : col.key === "break" ? "Break" : col.label}
                  </th>
                ))}
              </tr>
              {/* Row 2: Mon-Thu time ranges */}
              <tr className="bg-slate-700 text-white">
                {allCols.map((col) => (
                  <th key={col.key}
                    className={`border border-slate-600 py-1 px-1 text-center font-normal
                      ${col.key === "assembly" ? "bg-purple-900" : col.key === "break" ? "bg-amber-800" : "bg-slate-700"}`}>
                    {col.mt && (
                      <div className="text-slate-200 text-xs whitespace-nowrap">
                        {fmt(col.mt.start_time)}–{fmt(col.mt.end_time)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
              {/* Row 3: Day label */}
              <tr className="bg-slate-600 text-white">
                <th className="border border-slate-500 py-1 px-2 text-left text-xs font-semibold">
                  Monday–Thursday
                </th>
                {allCols.map((col) => (
                  <th key={col.key} className={`border border-slate-500 py-1 px-1 text-center text-xs
                    ${col.key === "assembly" ? "bg-purple-800" : col.key === "break" ? "bg-amber-700" : "bg-slate-600"}`}>
                    &nbsp;
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((cls: any, rowIdx: number) => {
                const clsCode = cls.class_code || cls.name;
                const incharge = CLASS_INCHARGE[clsCode] || "";
                const rowBg = rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50";
                return (
                  <tr key={cls.id} className={`${rowBg} hover:bg-blue-50`}>
                    {/* Class info cell */}
                    <td className="border border-slate-400 py-2 px-2 bg-slate-100 align-top">
                      <div className="font-bold text-slate-800 text-xs">{cls.name}</div>
                      <div className="text-slate-600 text-xs">{cls.program}</div>
                      <div className="text-slate-500 text-xs italic">{incharge}</div>
                    </td>
                    {allCols.map((col) => renderMasterCell(cls, col, rowIdx))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Hover any cell → edit button appears
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // TAB: COMBINED TABLE (per-day, all classes)
  // ════════════════════════════════════════════════════════════════
  const renderCombined = () => (
    <div className="space-y-8">
      {DAYS.map((day) => {
        const pList = day === "friday" ? fridayPeriods : monThuPeriods;
        return (
          <div key={day} className="card print:shadow-none print:break-inside-avoid">
            <h3 className="font-bold text-slate-800 text-base mb-3">{DAY_LABEL[day]}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>{renderHead(pList, true)}</thead>
                <tbody>
                  {classes.map((cls: any, idx: number) => renderClassRow(cls, day, pList, idx))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // TAB 2 — TEACHER REPORTS (one card per teacher)
  // ════════════════════════════════════════════════════════════════
  const renderTeachers = () => (
    <div className="space-y-8">
      {teachers.map((teacher: any) => {
        const sched = (timetable as any[]).filter((t: any) => t.teacher_id === teacher.id);
        const totalPeriods = sched.filter((t: any) => {
          const p = [...monThuPeriods, ...fridayPeriods].find((p: any) => p.id === t.period_id);
          return p && p.period_number !== 0 && p.period_number !== 4;
        }).length;

        const renderTeacherTable = (days: string[], pList: any[], label: string) => (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-1.5 px-2 text-left font-semibold min-w-16">Day</th>
                    {pList.map((p: any) => (
                      <th key={p.id} className={`border border-slate-300 py-1.5 px-1 text-center font-semibold min-w-[88px]
                        ${p.period_number === 0 ? "bg-purple-100" : p.period_number === 4 ? "bg-amber-100" : "bg-slate-100"}`}>
                        <div>{pLabel(p.period_number)}</div>
                        <div className="font-normal text-slate-500 text-xs">{pTime(p)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 font-semibold bg-slate-50 text-slate-700">
                        {DAY_SHORT[day]}
                      </td>
                      {pList.map((p: any) => {
                        const isAssembly = p.period_number === 0;
                        const isBreak = p.period_number === 4;
                        const entry = (!isAssembly && !isBreak)
                          ? sched.find((t: any) => t.day === day && t.period_id === p.id)
                          : undefined;
                        return (
                          <Cell key={p.id} entry={entry} period={p} isAssembly={isAssembly} isBreak={isBreak}
                            cellBg="" onEdit={setEditEntry}>
                            {entry && (
                              <div className="text-xs leading-tight py-0.5">
                                <div className="font-bold text-slate-800">{classMap[entry.class_id]?.name || "—"}</div>
                                <div className="text-slate-500">{subjectMap[entry.subject_id]?.name || "—"}</div>
                              </div>
                            )}
                          </Cell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <div key={teacher.id} className="card print:shadow-none print:break-inside-avoid">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">{teacher.name}</h3>
                <p className="text-xs text-slate-500">{teacher.department} · {teacher.designation}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                {totalPeriods} periods / week
              </span>
            </div>
            {renderTeacherTable(["monday", "tuesday", "wednesday", "thursday"], monThuPeriods, "Monday – Thursday")}
            {renderTeacherTable(["friday"], fridayPeriods, "Friday")}
          </div>
        );
      })}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // TAB 3 — CLASS REPORTS (one card per class, all days)
  // ════════════════════════════════════════════════════════════════
  const renderClasses = () => (
    <div className="space-y-8">
      {classes.map((cls: any) => {
        const sched = (timetable as any[]).filter((t: any) => t.class_id === cls.id);

        const renderClassTable = (days: string[], pList: any[], label: string) => (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-1.5 px-2 text-left font-semibold min-w-16">Day</th>
                    {pList.map((p: any) => (
                      <th key={p.id} className={`border border-slate-300 py-1.5 px-1 text-center font-semibold min-w-[88px]
                        ${p.period_number === 0 ? "bg-purple-100" : p.period_number === 4 ? "bg-amber-100" : "bg-slate-100"}`}>
                        <div>{pLabel(p.period_number)}</div>
                        <div className="font-normal text-slate-500 text-xs">{pTime(p)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 font-semibold bg-slate-50 text-slate-700">
                        {DAY_SHORT[day]}
                      </td>
                      {pList.map((p: any) => {
                        const isAssembly = p.period_number === 0;
                        const isBreak = p.period_number === 4;
                        const entry = (!isAssembly && !isBreak)
                          ? sched.find((t: any) => t.day === day && t.period_id === p.id)
                          : undefined;
                        return (
                          <Cell key={p.id} entry={entry} period={p} isAssembly={isAssembly} isBreak={isBreak}
                            cellBg="" onEdit={setEditEntry}>
                            {entry && (
                              <div className="text-xs leading-tight py-0.5">
                                <div className="font-bold text-slate-800">{subjectMap[entry.subject_id]?.name || "—"}</div>
                                <div className="text-slate-500">{entry.teacher_id ? teacherMap[entry.teacher_id]?.name : ""}</div>
                              </div>
                            )}
                          </Cell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <div key={cls.id} className="card print:shadow-none print:break-inside-avoid">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">{cls.name}</h3>
                <p className="text-xs text-slate-500">{cls.program} · Section {cls.section}</p>
              </div>
            </div>
            {renderClassTable(["monday", "tuesday", "wednesday", "thursday"], monThuPeriods, "Monday – Thursday")}
            {renderClassTable(["friday"], fridayPeriods, "Friday")}
          </div>
        );
      })}
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "master",   label: "Master Table" },
    { key: "combined", label: "Combined Table" },
    { key: "teachers", label: "Teacher Reports" },
    { key: "classes",  label: "Class Reports" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Weekly timetable reports — hover a cell to edit</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 text-sm"
        >
          <Printer size={15} /> Print / PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit print:hidden">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition ${
              tab === t.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "master"   && renderMaster()}
      {tab === "combined" && renderCombined()}
      {tab === "teachers" && renderTeachers()}
      {tab === "classes"  && renderClasses()}

      {/* Edit Modal */}
      {editEntry && (
        <EditModal
          entry={editEntry}
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}
