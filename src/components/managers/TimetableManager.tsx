"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";
import { Button, Select, PageHeader, Badge } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { TimetableGrid, type TimetableCellEntry } from "@/components/TimetableGrid";
import {
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from "@/lib/actions";

type PeriodRow = {
  id: number;
  period_number: number;
  start_time: Date;
  end_time: Date;
  applicable_day_type: "mon_thu" | "friday";
};

type Entry = {
  id: number;
  day: DayOfWeek;
  period_id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number | null;
  room: string | null;
  notes: string | null;
  is_active: boolean;
  subject?: { name: string; short_name: string | null } | null;
  teacher?: { name: string } | null;
  class?: { name: string } | null;
};

const isEntry = (e: TimetableCellEntry): e is Entry =>
  e !== null && e !== undefined;

export function TimetableManager({
  days,
  periods,
  grid,
  classes,
  subjects,
  teachers,
}: {
  days: DayOfWeek[];
  periods: PeriodRow[];
  grid: Record<string, Record<number, TimetableCellEntry>>;
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string; short_name: string | null }[];
  teachers: { id: number; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [preset, setPreset] = useState<{ day: DayOfWeek; period_id: number } | null>(null);

  const selectedClass = Number(searchParams.get("class")) || classes[0]?.id || 0;

  function onClassChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("class", v);
    else params.delete("class");
    router.push(`/timetable?${params.toString()}`);
  }

  function openCreate(day: DayOfWeek, period_id: number) {
    setPreset({ day, period_id });
    setEditing(null);
    setOpen(true);
  }

  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Click any cell to assign a subject and teacher"
        actions={
          <div className="flex items-center gap-2">
            <select className="input max-w-[200px]" value={selectedClass} onChange={(e) => onClassChange(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>
            <Button onClick={() => window.print()}>Print</Button>
          </div>
        }
      />

      <TimetableGrid
        days={days}
        periods={periods}
        grid={grid}
        title={`Class ${classes.find((c) => c.id === selectedClass)?.name ?? ""}`}
        cellRenderer={(day, period, entry) => (
          <div className="group relative">
            {entry ? (
              <>
                <div className="rounded-lg bg-brand-50 border border-brand-100 px-2 py-1.5">
                  <p className="font-medium text-slate-800 text-xs leading-snug">
                    {entry.subject?.short_name ?? entry.subject?.name ?? "—"}
                  </p>
                  {entry.teacher ? (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {entry.teacher.name}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      No teacher
                    </p>
                  )}
                  {entry.room ? (
                    <p className="text-[11px] text-slate-400">Room {entry.room}</p>
                  ) : null}
                </div>
                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition no-print">
                  <button
                    className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-brand-600"
                    onClick={() => {
                      if (!isEntry(entry)) return;
                      setPreset(null);
                      setEditing(entry as unknown as Entry);
                      setOpen(true);
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-red-600"
                    onClick={() => {
                      if (!isEntry(entry)) return;
                      setDeleting(entry as unknown as Entry);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => openCreate(day, period.id)}
                className="w-full h-full min-h-[44px] rounded-lg border border-dashed border-slate-200 text-slate-300 hover:border-brand-300 hover:text-brand-400 hover:bg-brand-50/40 flex items-center justify-center no-print"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        )}
      />

      <FormModal
        title={
          editing
            ? `Edit ${dayLabels[editing.day]} P${periods.find((p) => p.id === editing.period_id)?.period_number ?? ""}`
            : preset
              ? `${dayLabels[preset.day]} · Period ${periods.find((p) => p.id === preset.period_id)?.period_number ?? ""}`
              : "Timetable entry"
        }
        open={open}
        onClose={() => setOpen(false)}
        action={editing ? updateTimetable : createTimetable}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <input type="hidden" name="class_id" value={selectedClass} />
            <input
              type="hidden"
              name="day"
              value={editing?.day ?? preset?.day ?? "monday"}
            />
            <input
              type="hidden"
              name="period_id"
              value={editing?.period_id ?? preset?.period_id ?? ""}
            />
            <Select
              label="Subject"
              name="subject_id"
              defaultValue={editing?.subject_id ?? ""}
              required
              error={fieldError(state, "subject_id")}
            >
              <option value="">Select subject</option>
              {subjects
                .filter((s) => s.short_name !== "Break")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              {subjects
                .filter((s) => s.short_name === "Break")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
            <Select
              label="Teacher"
              name="teacher_id"
              defaultValue={editing?.teacher_id ?? ""}
              error={fieldError(state, "teacher_id")}
            >
              <option value="">No teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Room</label>
                <input name="room" className="input" defaultValue={editing?.room ?? ""} />
              </div>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editing ? editing.is_active : true}
                />
                <span className="text-sm text-slate-600">Active</span>
              </label>
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" defaultValue={editing?.notes ?? ""} />
            </div>
            {state?.message ? (
              <Badge tone="red">{state.message}</Badge>
            ) : null}
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete timetable entry"
        entity="timetable entry"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteTimetable}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}