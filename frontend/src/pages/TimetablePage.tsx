import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader, Pencil, Trash2, X, Save } from "lucide-react";
import * as api from "../utils/api";
import { DAY_LABELS } from "../utils/helpers";

// ── Edit / Delete Modal ────────────────────────────────────────────
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Edit Timetable Entry</h2>
        <p className="text-sm text-slate-500 mb-5">
          {cls?.name} · {DAY_LABELS[entry.day] || entry.day}
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
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700">
              <Trash2 size={14} /> Delete entry
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Confirm?</span>
              <button onClick={handleDelete} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-slate-500 hover:text-slate-700">No</button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function TimetablePage() {
  const [view, setView] = useState<"class" | "teacher">("class");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<any>(null);
  const qc = useQueryClient();

  const { data: rawTimetable = [], isLoading } = useQuery({ queryKey: ["timetable"], queryFn: api.getTimetable });
  const { data: rawClasses = [] } = useQuery({ queryKey: ["classes"], queryFn: api.getClasses });
  const { data: rawTeachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: api.getTeachers });
  const { data: rawSubjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: api.getSubjects });
  const { data: rawPeriods = [] } = useQuery({ queryKey: ["periods"], queryFn: api.getPeriods });

  const timetable = Array.isArray(rawTimetable) ? rawTimetable : [];
  const classes = Array.isArray(rawClasses) ? rawClasses : [];
  const teachers = Array.isArray(rawTeachers) ? rawTeachers : [];
  const subjects = Array.isArray(rawSubjects) ? rawSubjects : [];
  const periods = Array.isArray(rawPeriods) ? rawPeriods : [];

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader className="animate-spin" /></div>;

  const teacherMap = Object.fromEntries(teachers.map((t: any) => [t.id, t]));
  const subjectMap = Object.fromEntries(subjects.map((s: any) => [s.id, s]));

  const monThuPeriods: any[] = periods
    .filter((p: any) => p.applicable_day_type === "mon_thu")
    .sort((a: any, b: any) => a.period_number - b.period_number);
  const fridayPeriods: any[] = periods
    .filter((p: any) => p.applicable_day_type === "friday")
    .sort((a: any, b: any) => a.period_number - b.period_number);

  const fmt12 = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const pLabel = (n: number) => n === 0 ? "Assembly" : n === 4 ? "Break" : `Period ${n}`;
  const pTime = (p: any) => `${fmt12(p.start_time)} – ${fmt12(p.end_time)}`;

  // ── API mutations ────────────────────────────────────────────────
  const handleSave = async (id: number, data: any) => {
    await api.updateTimetable(id, data);
    qc.invalidateQueries({ queryKey: ["timetable"] });
  };
  const handleDelete = async (id: number) => {
    await api.deleteTimetable(id);
    qc.invalidateQueries({ queryKey: ["timetable"] });
  };

  // ── Shared table renderer ────────────────────────────────────────
  const renderTable = (
    schedule: any[],
    label: string,
    days: string[],
    periodList: any[],
    renderCell: (entry: any, period: any) => React.ReactNode
  ) => (
    <div className="mb-8">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 py-2 px-3 font-semibold text-left min-w-24">Day</th>
              {periodList.map((p: any) => (
                <th key={p.id} className={`border border-slate-300 py-2 px-2 text-center font-semibold min-w-28
                  ${p.period_number === 0 ? "bg-purple-100" : p.period_number === 4 ? "bg-amber-100" : "bg-slate-100"}`}>
                  <div className="font-bold text-slate-800">{pLabel(p.period_number)}</div>
                  <div className="text-xs text-slate-500 font-normal mt-0.5">{pTime(p)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="hover:bg-slate-50">
                <td className="border border-slate-300 py-3 px-3 font-semibold bg-slate-50 text-slate-700">
                  {DAY_LABELS[day]}
                </td>
                {periodList.map((p: any) => {
                  if (p.period_number === 4) {
                    return (
                      <td key={p.id} className="border border-slate-300 py-2 px-2 text-center bg-amber-50 text-amber-600 font-semibold align-middle">
                        Break
                      </td>
                    );
                  }
                  if (p.period_number === 0) {
                    return (
                      <td key={p.id} className="border border-slate-300 py-2 px-2 text-center bg-purple-50 text-purple-700 font-semibold align-middle">
                        Assembly
                      </td>
                    );
                  }
                  const entry = schedule.find((t: any) => t.day === day && t.period_id === p.id);
                  return (
                    <td key={p.id} className="border border-slate-300 py-1 px-1 text-center align-middle group relative">
                      {entry ? (
                        <div className="relative">
                          {renderCell(entry, p)}
                          <button
                            onClick={() => setEditEntry(entry)}
                            className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 z-10"
                            title="Edit"
                          >
                            <Pencil size={10} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Class View ───────────────────────────────────────────────────
  if (view === "class") {
    const classToShow = selectedClassId ?? (classes[0] as any)?.id;
    const classEntry = classes.find((c: any) => c.id === classToShow);
    const classSchedule = (timetable as any[]).filter((t: any) => t.class_id === classToShow);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title">Timetable — Class View</h1>
            <p className="text-slate-500 mt-1 text-sm">Hover any cell to edit · Weekly schedule per class</p>
          </div>
          <button onClick={() => setView("teacher")}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 text-sm">
            Switch to Teacher View →
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {classes.map((cls: any) => (
            <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                (selectedClassId ?? (classes[0] as any)?.id) === cls.id
                  ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}>
              {cls.name}
            </button>
          ))}
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-6 text-slate-800">{classEntry?.name} — Weekly Schedule</h3>
          {renderTable(classSchedule, "Monday – Thursday", ["monday", "tuesday", "wednesday", "thursday"], monThuPeriods,
            (entry) => (
              <div className="bg-blue-50 p-1.5 rounded border border-blue-200">
                <p className="font-bold text-slate-900 leading-tight">{subjectMap[entry.subject_id]?.name || "—"}</p>
                <p className="text-slate-600 leading-tight mt-0.5 text-xs">
                  {entry.teacher_id ? teacherMap[entry.teacher_id]?.name : ""}
                </p>
              </div>
            )
          )}
          {renderTable(classSchedule, "Friday", ["friday"], fridayPeriods,
            (entry) => (
              <div className="bg-blue-50 p-1.5 rounded border border-blue-200">
                <p className="font-bold text-slate-900 leading-tight">{subjectMap[entry.subject_id]?.name || "—"}</p>
                <p className="text-slate-600 leading-tight mt-0.5 text-xs">
                  {entry.teacher_id ? teacherMap[entry.teacher_id]?.name : ""}
                </p>
              </div>
            )
          )}
        </div>

        {editEntry && (
          <EditModal entry={editEntry} teachers={teachers} subjects={subjects} classes={classes}
            onSave={handleSave} onDelete={handleDelete} onClose={() => setEditEntry(null)} />
        )}
      </div>
    );
  }

  // ── Teacher View ─────────────────────────────────────────────────
  const teacherToShow = selectedTeacherId ?? (teachers[0] as any)?.id;
  const teacherEntry = teachers.find((t: any) => t.id === teacherToShow);
  const teacherSchedule = (timetable as any[]).filter((t: any) => t.teacher_id === teacherToShow);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Timetable — Teacher View</h1>
          <p className="text-slate-500 mt-1 text-sm">Hover any cell to edit · Weekly schedule per teacher</p>
        </div>
        <button onClick={() => setView("class")}
          className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 text-sm">
          ← Switch to Class View
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {teachers.map((teacher: any) => (
          <button key={teacher.id} onClick={() => setSelectedTeacherId(teacher.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
              (selectedTeacherId ?? (teachers[0] as any)?.id) === teacher.id
                ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}>
            {teacher.name}
          </button>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-6 text-slate-800">{teacherEntry?.name} — Weekly Schedule</h3>
        {renderTable(teacherSchedule, "Monday – Thursday", ["monday", "tuesday", "wednesday", "thursday"], monThuPeriods,
          (entry) => (
            <div className="bg-green-50 p-1.5 rounded border border-green-200">
              <p className="font-bold text-slate-900 leading-tight">{classes.find((c: any) => c.id === entry.class_id)?.name || "—"}</p>
              <p className="text-slate-600 leading-tight mt-0.5 text-xs">{subjectMap[entry.subject_id]?.name || "—"}</p>
            </div>
          )
        )}
        {renderTable(teacherSchedule, "Friday", ["friday"], fridayPeriods,
          (entry) => (
            <div className="bg-green-50 p-1.5 rounded border border-green-200">
              <p className="font-bold text-slate-900 leading-tight">{classes.find((c: any) => c.id === entry.class_id)?.name || "—"}</p>
              <p className="text-slate-600 leading-tight mt-0.5 text-xs">{subjectMap[entry.subject_id]?.name || "—"}</p>
            </div>
          )
        )}
      </div>

      {editEntry && (
        <EditModal entry={editEntry} teachers={teachers} subjects={subjects} classes={classes}
          onSave={handleSave} onDelete={handleDelete} onClose={() => setEditEntry(null)} />
      )}
    </div>
  );
}
