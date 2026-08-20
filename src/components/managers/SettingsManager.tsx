"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Badge, PageHeader } from "@/components/ui";
import { FormModal, DeleteConfirm, fieldError } from "@/components/FormModal";
import {
  updateSettings,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/actions";

type Setting = {
  id: number;
  school_name: string;
  school_logo: string | null;
  academic_session: string | null;
  working_days: string;
};

const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function LogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onChange(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className="text-sm font-medium text-slate-700 mb-1.5 block">
        School logo
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition ${
          drag
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo is a local data URL
          <img
            src={value}
            alt="School logo"
            className="h-20 w-20 object-contain"
          />
        ) : (
          <ImagePlus size={28} className="text-slate-400" />
        )}
        <p className="text-sm text-slate-600">
          {value ? "Drop a new image or click to replace" : "Drag & drop your logo here, or click to browse"}
        </p>
        <p className="text-xs text-slate-400">PNG or JPG, up to 2 MB</p>
      </div>
      {error ? <p className="text-sm text-red-600 mt-1">{error}</p> : null}
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          readFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            className="hover:bg-red-50 hover:text-red-600"
            onClick={() => onChange("")}
          >
            <X size={15} /> Remove logo
          </Button>
        </div>
      ) : null}
      <input type="hidden" name="school_logo" value={value} />
    </div>
  );
}

type User = {
  id: number;
  name: string;
  username: string;
  role: string;
  is_active: boolean;
};

function SchoolProfileForm({ setting }: { setting: Setting | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateSettings, {});
  const [logo, setLogo] = useState(setting?.school_logo ?? "");
  const [days, setDays] = useState<string[]>(
    (setting?.working_days ?? "monday,tuesday,wednesday,thursday,friday,saturday,sunday")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
  );

  const toggleDay = (d: string) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Settings saved");
      router.refresh();
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="School name"
        name="school_name"
        defaultValue={setting?.school_name ?? "Smart Timetable School"}
        required
        error={fieldError(state, "school_name")}
      />
      <LogoUpload value={logo} onChange={setLogo} />
      <Input
        label="Academic session"
        name="academic_session"
        defaultValue={setting?.academic_session ?? ""}
        placeholder="2026-2027"
      />
      <div>
        <span className="text-sm font-medium text-slate-700 mb-1.5 block">
          Working days
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {WEEKDAYS.map((d) => {
            const checked = days.includes(d.value);
            return (
              <label
                key={d.value}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition select-none ${
                  checked
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="working_days"
                  value={d.value}
                  checked={checked}
                  onChange={() => toggleDay(d.value)}
                  className="accent-brand-600"
                />
                {d.label}
              </label>
            );
          })}
        </div>
        <input type="hidden" name="working_days" value={days.join(",")} />
        {fieldError(state, "working_days") ? (
          <p className="text-sm text-red-600 mt-1">
            {fieldError(state, "working_days")}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

export function SettingsManager({
  setting,
  users,
  isAdmin,
  currentUserId,
}: {
  setting: Setting | null;
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [userOpen, setUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle={isAdmin ? "School profile and user accounts" : "School profile"}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">School profile</h2>
          <SchoolProfileForm setting={setting} />
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-900">User accounts</h2>
            </div>
            {isAdmin ? (
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setUserOpen(true);
                }}
              >
                <Plus size={16} /> Add user
              </Button>
            ) : null}
          </div>

          {!isAdmin ? (
            <p className="p-6 text-sm text-slate-500">
              Only admins can manage user accounts.
            </p>
          ) : (
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">
                      {u.name}
                      {u.id === Number(currentUserId) ? (
                        <span className="text-xs text-slate-400 ml-1">(you)</span>
                      ) : null}
                    </td>
                    <td className="text-slate-500">{u.username}</td>
                    <td>
                      <Badge tone={u.role === "admin" ? "blue" : "gray"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={u.is_active ? "green" : "red"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="no-print">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingUser(u);
                            setUserOpen(true);
                          }}
                        >
                          <Pencil size={15} />
                        </Button>
                        {u.id !== Number(currentUserId) ? (
                          <Button
                            variant="ghost"
                            className="hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FormModal
        title={editingUser ? `Edit ${editingUser.name}` : "Add user"}
        open={userOpen}
        onClose={() => setUserOpen(false)}
        action={editingUser ? updateUser : createUser}
      >
        {(state) => (
          <>
            {editingUser ? <input type="hidden" name="id" value={editingUser.id} /> : null}
            <Input
              label="Full name"
              name="name"
              defaultValue={editingUser?.name ?? ""}
              required
              error={fieldError(state, "name")}
            />
            <Input
              label="Username"
              name="username"
              defaultValue={editingUser?.username ?? ""}
              required
              error={fieldError(state, "username")}
            />
            <Input
              label={editingUser ? "New password (leave blank to keep)" : "Password"}
              name="password"
              type="password"
              placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
              required={!editingUser}
              error={fieldError(state, "password")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Role"
                name="role"
                defaultValue={editingUser?.role ?? "scheduler"}
              >
                <option value="admin">Admin</option>
                <option value="scheduler">Scheduler</option>
              </Select>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingUser ? editingUser.is_active : true}
                />
                <span className="text-sm text-slate-600">Active</span>
              </label>
            </div>
          </>
        )}
      </FormModal>

      <DeleteConfirm
        title="Delete user"
        entity="user"
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        action={deleteUser}
      >
        {deletingUser ? <input type="hidden" name="id" value={deletingUser.id} /> : null}
      </DeleteConfirm>
    </div>
  );
}