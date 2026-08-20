"use client";

import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
        ? "btn-secondary"
        : variant === "danger"
          ? "btn-danger"
          : "inline-flex items-center gap-1 font-medium text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition";
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <input className="input" {...props} />
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export function Select({
  label,
  error,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <select className="input" {...props}>
        {children}
      </select>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <textarea className="input" rows={3} {...props} />
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  className = "",
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      {children}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "amber" | "blue" | "gray";
}) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-brand-50 text-brand-700 border border-brand-100",
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return <span className={`badge ${map[tone]}`}>{children}</span>;
}

export function statusTone(status: string): "green" | "red" | "amber" | "blue" | "gray" {
  switch (status) {
    case "active":
    case "assigned":
    case "absent":
      return "green";
    case "inactive":
    case "cancelled":
      return "red";
    case "pending":
      return "amber";
    default:
      return "gray";
  }
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 no-print">{actions}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center py-14 text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      {description ? <p className="text-sm mt-1">{description}</p> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 mb-4">
      {message}
    </div>
  );
}