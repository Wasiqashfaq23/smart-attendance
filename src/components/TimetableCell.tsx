import type { DayOfWeek } from "@prisma/client";

export type TimetableCellEntry = {
  id: number;
  day: DayOfWeek;
  period_id: number;
  subject?: { name: string; short_name: string | null; is_special?: boolean } | null;
  teacher?: { name: string } | null;
  class?: { name: string } | null;
  room?: string | null;
  notes?: string | null;
  additionalSubjects?: {
    subject: { name: string; short_name: string | null; is_special?: boolean };
  }[];
  additionalTeachers?: { teacher: { name: string } }[];
} | null;

export function combinedSubjectNames(entry: NonNullable<TimetableCellEntry>): string {
  const primary = entry.subject ? (entry.subject.short_name ?? entry.subject.name) : null;
  const extra = (entry.additionalSubjects ?? []).map(
    (s) => s.subject.short_name ?? s.subject.name
  );
  return [primary, ...extra].filter(Boolean).join(" + ");
}

export function combinedTeacherNames(entry: NonNullable<TimetableCellEntry>): string {
  const primary = entry.teacher?.name ?? null;
  const extra = (entry.additionalTeachers ?? []).map((t) => t.teacher.name);
  return [primary, ...extra].filter(Boolean).join(" / ");
}

export function isSpecialEntry(entry: NonNullable<TimetableCellEntry>): boolean {
  return entry.subject?.is_special ?? false;
}

export function isBreakEntry(entry: NonNullable<TimetableCellEntry>): boolean {
  return (entry.subject?.short_name ?? entry.subject?.name ?? "")
    .toLowerCase()
    .includes("break");
}

export function cellToneClass(entry: TimetableCellEntry | null): string {
  if (!entry) return "";
  if (isBreakEntry(entry)) return "bg-amber-50 text-center";
  if (isSpecialEntry(entry)) return "bg-amber-50";
  return "";
}

export type TimetableCellMeta = {
  substitution?: {
    status: string;
    substitute_teacher?: { name: string } | null;
  } | null;
  is_covered?: boolean;
};

export function TimetableCell({
  entry,
  showTeacher = true,
  showNoTeacher = false,
  meta,
}: {
  entry: NonNullable<TimetableCellEntry>;
  showTeacher?: boolean;
  showNoTeacher?: boolean;
  meta?: TimetableCellMeta;
}) {
  return (
    <>
      <p className="font-medium text-slate-800 leading-snug">
        {combinedSubjectNames(entry)}
      </p>
      {showTeacher ? (
        combinedTeacherNames(entry) ? (
          <p className="text-xs text-slate-500">{combinedTeacherNames(entry)}</p>
        ) : showNoTeacher ? (
          <p className="text-xs text-amber-600">No teacher</p>
        ) : null
      ) : null}
      {entry.room ? (
        <p className="text-xs text-slate-400">Room {entry.room}</p>
      ) : null}
      {meta?.substitution ? (
        <p
          className={`text-xs ${
            meta.substitution.status === "assigned"
              ? "text-emerald-600"
              : "text-amber-600"
          }`}
        >
          {meta.substitution.status === "assigned"
            ? `Covered by ${meta.substitution.substitute_teacher?.name}`
            : "Needs coverage"}
        </p>
      ) : meta?.is_covered === false ? (
        <p className="text-xs text-red-600">Teacher absent — uncovered</p>
      ) : null}
    </>
  );
}