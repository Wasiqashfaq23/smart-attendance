"use client";

import { useRouter } from "next/navigation";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-secondary">
      Print
    </button>
  );
}

export function SelectNav({
  name,
  value,
  options,
  tab,
}: {
  name: string;
  value: number;
  options: { id: number; label: string }[];
  tab: string;
}) {
  const router = useRouter();
  return (
    <select
      name={name}
      className="input max-w-[260px]"
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams();
        p.set("tab", tab);
        if (e.target.value) p.set(name, e.target.value);
        router.push(`/reports?${p.toString()}`);
      }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DateNav({ value, tab }: { value: string; tab: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      name="date"
      defaultValue={value}
      className="input max-w-[200px]"
      onChange={(e) => {
        const p = new URLSearchParams();
        p.set("tab", tab);
        if (e.target.value) p.set("date", e.target.value);
        router.push(`/reports?${p.toString()}`);
      }}
    />
  );
}