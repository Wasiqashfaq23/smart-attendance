"use client";

import { useState } from "react";
import { Plus, Undo2, XCircle, Trash2 } from "lucide-react";
import { Button, Select, Input, Textarea, Badge, statusTone, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, InlineAction, fieldError } from "@/components/FormModal";
import {
  createAbsence,
  cancelAbsenceAction,
  reactivateAbsenceAction,
  deleteAbsence,
} from "@/lib/actions";

type Absence = {
  id: number;
  teacher: { id: number; name: string };
  date: Date;
  reason: string | null;
  status: string;
  notes: string | null;
};

export function AbsenceManager({
  absences,
  teachers,
}: {
  absences: Absence[];
  teachers: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Absence | null>(null);

  return (
    <div>
      <PageHeader
        title="Absences"
        subtitle={`${absences.length} record(s)`}
        actions={
          <Button
            onClick={() => {
              setOpen(true);
            }}
          >
            <Plus size={16} /> Mark absence
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {absences.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No absences recorded.</p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Notes</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.teacher.name}</td>
                  <td className="text-slate-500 whitespace-nowrap">
                    {a.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="text-slate-500">{a.reason ?? "—"}</td>
                  <td>
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="text-slate-500 max-w-[220px] truncate">
                    {a.notes ?? "—"}
                  </td>
                  <td className="no-print">
                    <div className="flex justify-end gap-1.5 items-center">
                      {a.status === "absent" ? (
                        <InlineAction
                          action={cancelAbsenceAction}
                          id={a.id}
                          confirm="Cancel this absence and its pending substitutions?"
                        >
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2 py-1.5">
                            <XCircle size={13} /> Cancel
                          </span>
                        </InlineAction>
                      ) : (
                        <InlineAction
                          action={reactivateAbsenceAction}
                          id={a.id}
                        >
                          <span className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg px-2 py-1.5">
                            <Undo2 size={13} /> Reactivate
                          </span>
                        </InlineAction>
                      )}
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
        title="Mark teacher absent"
        open={open}
        onClose={() => setOpen(false)}
        action={createAbsence}
      >
        {(state) => (
          <>
            <Select
              label="Teacher"
              name="teacher_id"
              defaultValue=""
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
            <Input
              label="Date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              error={fieldError(state, "date")}
            />
            <Input
              label="Reason"
              name="reason"
              defaultValue=""
              placeholder="e.g. Medical leave"
            />
            <Textarea
              label="Notes"
              name="notes"
              defaultValue=""
              placeholder="Optional notes"
            />
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete absence"
        entity="absence"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteAbsence}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}