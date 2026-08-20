"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Select, Badge, statusTone, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { createSubject, updateSubject, deleteSubject } from "@/lib/actions";

type Subject = {
  id: number;
  name: string;
  short_name: string | null;
  department: string | null;
  status: string;
};

export function SubjectManager({ subjects }: { subjects: Subject[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subject(s)`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add subject
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {subjects.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No subjects yet.</p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Short name</th>
                <th>Department</th>
                <th>Status</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-slate-500">{s.short_name ?? "—"}</td>
                  <td className="text-slate-500">{s.department ?? "—"}</td>
                  <td>
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  </td>
                  <td className="no-print">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(s);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleting(s)}
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
        title={editing ? `Edit ${editing.name}` : "Add subject"}
        open={open}
        onClose={() => setOpen(false)}
        action={editing ? updateSubject : createSubject}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Input
              label="Name"
              name="name"
              defaultValue={editing?.name ?? ""}
              placeholder="Physics"
              required
              error={fieldError(state, "name")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Short name"
                name="short_name"
                defaultValue={editing?.short_name ?? ""}
                placeholder="Physics"
              />
              <Select
                label="Department"
                name="department"
                defaultValue={editing?.department ?? ""}
              >
                <option value="">Select department</option>
                {[
                  "Science",
                  "Arts",
                  "Languages",
                  "Computer",
                  "Islamic Studies",
                  "General",
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="Status"
              name="status"
              defaultValue={editing?.status ?? "active"}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete subject"
        entity="subject"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteSubject}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}