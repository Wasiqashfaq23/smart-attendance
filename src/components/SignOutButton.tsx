"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { Modal } from "@/components/ui";
import { signOutAction } from "@/lib/authActions";

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
      >
        <LogOut size={16} />
        Sign out
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Sign out">
        <p className="text-sm text-slate-600">
          Do you want to sign out? You will be returned to the public view.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={pending} onClick={confirm}>
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Modal>
    </>
  );
}