"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Badge, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { createPeriod, updatePeriod, deletePeriod } from "@/lib/actions";

type Period = {
  id: number;
  period_number: number;
  start_time: Date;
  end_time: Date;
  applicable_day_type: "mon_thu" | "friday";
  is_active: boolean;
};

function toHHMM(d: Date) {
  return d.toISOString().slice(11, 16);
}

function PeriodTable({
  rows,
  label,
  onEdit,
  onDelete,
}: {
  rows: Period[];
  label: string;
  onEdit: (p: Period) => void;
  onDelete: (p: Period) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{label}</h2>
      </div>
      <table className="tbl w-full">
        <thead>
          <tr>
            <th>Period</th>
            <th>Start</th>
            <th>End</th>
            <th>Active</th>
            <th className="no-print"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">Period {p.period_number}</td>
              <td className="text-slate-500">{toHHMM(p.start_time)}</td>
              <td className="text-slate-500">{toHHMM(p.end_time)}</td>
              <td>
                <Badge tone={p.is_active ? "green" : "gray"}>
                  {p.is_active ? "Active" : "Off"}
                </Badge>
              </td>
              <td className="no-print">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" onClick={() => onEdit(p)}>
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDelete(p)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PeriodManager({ periods }: { periods: Period[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [deleting, setDeleting] = useState<Period | null>(null);

  const monThu = periods.filter((p) => p.applicable_day_type === "mon_thu");
  const friday = periods.filter((p) => p.applicable_day_type === "friday");

  return (
    <div>
      <PageHeader
        title="Periods"
        subtitle={`${monThu.length} Mon–Thu · ${friday.length} Friday`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add period
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <PeriodTable
          rows={monThu}
          label="Mon – Thu schedule"
          onEdit={(p) => {
            setEditing(p);
            setOpen(true);
          }}
          onDelete={(p) => setDeleting(p)}
        />
        <PeriodTable
          rows={friday}
          label="Friday schedule"
          onEdit={(p) => {
            setEditing(p);
            setOpen(true);
          }}
          onDelete={(p) => setDeleting(p)}
        />
      </div>

      <FormModal
        title={editing ? `Edit period ${editing.period_number}` : "Add period"}
        open={open}
        onClose={() => setOpen(false)}
        action={editing ? updatePeriod : createPeriod}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Period number</label>
                <input
                  type="number"
                  name="period_number"
                  className="input"
                  min={0}
                  defaultValue={editing?.period_number ?? 0}
                  required
                />
                <FieldErr msg={fieldError(state, "period_number")} />
              </div>
              <div>
                <label className="label">Start</label>
                <input
                  type="time"
                  name="start_time"
                  className="input"
                  defaultValue={editing ? toHHMM(editing.start_time) : "08:00"}
                  required
                />
                <FieldErr msg={fieldError(state, "start_time")} />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  type="time"
                  name="end_time"
                  className="input"
                  defaultValue={editing ? toHHMM(editing.end_time) : "08:40"}
                  required
                />
                <FieldErr msg={fieldError(state, "end_time")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Applicable days</label>
                <select
                  name="applicable_day_type"
                  className="input"
                  defaultValue={editing?.applicable_day_type ?? "mon_thu"}
                >
                  <option value="mon_thu">Mon – Thu</option>
                  <option value="friday">Friday</option>
                </select>
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
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete period"
        entity="period"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deletePeriod}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}