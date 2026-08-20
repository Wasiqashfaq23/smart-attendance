"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ClassPicker({
  classes,
  current,
}: {
  classes: { id: number; name: string }[];
  current: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("class", v);
    else params.delete("class");
    router.push(`/?${params.toString()}`);
  }

  return (
    <select
      className="input max-w-[220px]"
      value={current}
      onChange={(e) => onChange(e.target.value)}
    >
      {classes.map((c) => (
        <option key={c.id} value={c.id}>
          Class {c.name}
        </option>
      ))}
    </select>
  );
}