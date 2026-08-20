"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Select, Badge, statusTone, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import { createClass, updateClass, deleteClass } from "@/lib/actions";

type ClassRoom = {
  id: number;
  name: string;
  section: string | null;
  program: string | null;
  class_code: string;
  class_teacher_id: number | null;
  class_teacher?: { id: number; name: string } | null;
  status: string;
};

export function ClassManager({
  classes,
  teachers,
}: {
  classes: ClassRoom[];
  teachers: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [deleting, setDeleting] = useState<ClassRoom | null>(null);

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle={`${classes.length} class(es)`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add class
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {classes.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No classes yet.</p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Section</th>
                <th>Program</th>
                <th>Class teacher</th>
                <th>Code</th>
                <th>Status</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-slate-500">{c.section ?? "—"}</td>
                  <td className="text-slate-500">{c.program ?? "—"}</td>
                  <td className="text-slate-500">
                    {c.class_teacher?.name ?? "—"}
                  </td>
                  <td className="text-slate-500">{c.class_code}</td>
                  <td>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="no-print">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleting(c)}
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
        title={editing ? `Edit ${editing.name}` : "Add class"}
        open={open}
        onClose={() => setOpen(false)}
        action={editing ? updateClass : createClass}
      >
        {(state) => (
          <>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                name="name"
                defaultValue={editing?.name ?? ""}
                placeholder="B1"
                required
                error={fieldError(state, "name")}
              />
              <Input
                label="Section"
                name="section"
                defaultValue={editing?.section ?? ""}
              />
            </div>
            <Input
              label="Program"
              name="program"
              defaultValue={editing?.program ?? ""}
              placeholder="Engg+Med"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Class code"
                name="class_code"
                defaultValue={editing?.class_code ?? ""}
                placeholder="B1"
                required
                error={fieldError(state, "class_code")}
              />
              <Select
                label="Status"
                name="status"
                defaultValue={editing?.status ?? "active"}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <Select
              label="Class teacher"
              name="class_teacher_id"
              defaultValue={editing?.class_teacher_id ?? ""}
            >
              <option value="">No class teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete class"
        entity="class"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        action={deleteClass}
      >
        {deleting ? <input type="hidden" name="id" value={deleting.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}