"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { DayOfWeek, PeriodDayType } from "@prisma/client";
import { DAY_LABELS, dayTypeFor } from "@/lib/weekdays";
import { Button, Select, Input, Badge, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { saveAvailability, deleteAvailability } from "@/lib/actions";

type Availability = {
  id: number;
  teacher: { id: number; name: string };
  day: string;
  period: { id: number; period_number: number; applicable_day_type: string };
  is_available: boolean;
  notes: string | null;
};

export function AvailabilityManager({
  rows,
  teachers,
  periods,
}: {
  rows: Availability[];
  teachers: { id: number; name: string }[];
  periods: { id: number; period_number: number; applicable_day_type: PeriodDayType }[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Availability | null>(null);
  const [deleting, setDeleting] = useState<Availability | null>(null);
  const [formDay, setFormDay] = useState("monday");

  const dayLabels: Record<string, string> = DAY_LABELS;

  const filteredPeriods = periods.filter(
    (p) => p.applicable_day_type === dayTypeFor(formDay as DayOfWeek)
  );

  function onDayChange(v: string) {
    setFormDay(v);
  }

  function openEdit(a: Availability) {
    setEditing(a);
    setFormDay(a.day);
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Teacher Availability"
        subtitle="Mark when teachers are free or unavailable for substitution"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormDay("monday");
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add slot
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-slate-500">
            No availability rules yet.
          </p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Day</th>
                <th>Period</th>
                <th>Status</th>
                <th>Notes</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.teacher.name}</td>
                  <td className="text-slate-500 capitalize">{dayLabels[a.day]}</td>
                  <td className="text-slate-500">
                    P{a.period.period_number}
                    {a.period.applicable_day_type === "friday"
                      ? " (Fri)"
                      : a.period.applicable_day_type === "saturday"
                        ? " (Sat)"
                        : ""}
                  </td>
                  <td>
                    <Badge tone={a.is_available ? "green" : "red"}>
                      {a.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </td>
                  <td className="text-slate-500 max-w-[240px] truncate">
                    {a.notes ?? "—"}
                  </td>
                  <td className="no-print">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => openEdit(a)}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleting(a)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FormModal
        title={editing ? "Edit availability slot" : "Add availability slot"}
        open={open}
        onClose={() => setOpen(false)}
        action={saveAvailability}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Select
              label="Teacher"
              name="teacher_id"
              defaultValue={editing?.teacher.id ?? ""}
              required
              error={fieldError(state, "teacher_id")}
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Day"
                name="day"
                defaultValue={editing?.day ?? "monday"}
                onChange={(e) => onDayChange(e.target.value)}
              >
                {Object.entries(dayLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select
                label="Period"
                name="period_id"
                defaultValue={editing?.period.id ?? ""}
                required
                error={fieldError(state, "period_id")}
              >
                <option value="">Select period</option>
                {filteredPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    P{p.period_number}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_available"
                defaultChecked={editing ? editing.is_available : true}
              />
              <span className="text-sm text-slate-600">
                Available for substitution
              </span>
            </label>
            <Input
              label="Notes"
              name="notes"
              defaultValue={editing?.notes ?? ""}
              placeholder="e.g. On lab duty"
            />
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete availability slot"
        entity="availability slot"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteAvailability}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}