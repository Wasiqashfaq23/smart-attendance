"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Select, Badge, statusTone, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { createTeacher, updateTeacher, deleteTeacher } from "@/lib/actions";

type Teacher = {
  id: number;
  name: string;
  employee_code: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  status: string;
};

export function TeacherManager({ teachers }: { teachers: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher(s)`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add teacher
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {teachers.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No teachers yet.</p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td className="text-slate-500">{t.employee_code}</td>
                  <td className="text-slate-500">{t.department ?? "—"}</td>
                  <td className="text-slate-500">{t.designation ?? "—"}</td>
                  <td className="text-slate-500">
                    {t.email ?? t.phone ?? "—"}
                  </td>
                  <td>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </td>
                  <td className="no-print">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleting(t)}
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
        title={editing ? `Edit ${editing.name}` : "Add teacher"}
        open={open}
        onClose={() => setOpen(false)}
        action={editing ? updateTeacher : createTeacher}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Input
              label="Full name"
              name="name"
              defaultValue={editing?.name ?? ""}
              placeholder="e.g. Ms. Arshia"
              required
              error={fieldError(state, "name")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Employee code"
                name="employee_code"
                defaultValue={editing?.employee_code ?? ""}
                placeholder="T001"
                required
                error={fieldError(state, "employee_code")}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
                placeholder="teacher@school.edu"
                error={fieldError(state, "email")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone"
                name="phone"
                defaultValue={editing?.phone ?? ""}
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
            <Input
              label="Designation"
              name="designation"
              defaultValue={editing?.designation ?? ""}
              placeholder="Teacher"
            />
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
        title="Delete teacher"
        entity="teacher"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteTeacher}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}