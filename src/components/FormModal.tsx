"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Modal, ErrorBanner } from "@/components/ui";
import type { ActionState } from "@/lib/actions";

export function FormModal({
  title,
  open,
  onClose,
  action,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: (state: ActionState) => React.ReactNode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      formRef.current?.reset();
      router.refresh();
      onClose();
    } else if (state?.message || state?.fieldErrors) {
      toast.error(state.message ?? "Please check the form");
    }
  }, [state, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form ref={formRef} action={formAction} className="space-y-4">
        {state?.message ? <ErrorBanner message={state.message} /> : null}
        {children(state)}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteConfirm({
  title,
  entity,
  open,
  onClose,
  action,
  children,
}: {
  title: string;
  entity: string;
  open: boolean;
  onClose: () => void;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Deleted");
      router.refresh();
      onClose();
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {state?.message ? <ErrorBanner message={state.message} /> : null}
      <p className="text-sm text-slate-600 mb-5">
        Are you sure you want to delete this {entity}? This action cannot be
        undone.
      </p>
      <form action={formAction} className="flex justify-end gap-2">
        {children}
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete"}
        </button>
      </form>
    </Modal>
  );
}

export function fieldError(
  state: { fieldErrors?: Record<string, string[]> },
  field: string
): string | undefined {
  return state.fieldErrors?.[field]?.[0];
}

export function InlineAction({
  action,
  id,
  children,
  confirm,
  disabled,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  id: number | string;
  children: React.ReactNode;
  confirm?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Done");
      router.refresh();
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={
        confirm
          ? (e) => {
              if (!window.confirm(confirm)) e.preventDefault();
            }
          : undefined
      }
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending || disabled} className="disabled:opacity-50">
        {children}
      </button>
    </form>
  );
}