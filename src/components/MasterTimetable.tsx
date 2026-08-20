import Link from "next/link";
import type { DayOfWeek } from "@prisma/client";
import { getMasterDay } from "@/lib/services/report";
import {
  TimetableCell,
  cellToneClass,
  type TimetableCellEntry,
} from "@/components/TimetableCell";
import { formatTime } from "@/lib/validation";
import { DAY_LABELS, WEEK_DAYS } from "@/lib/weekdays";

export const MASTER_DAYS = WEEK_DAYS;

export const MASTER_DAY_LABELS: Record<string, string> = DAY_LABELS;

export function parseMasterDay(value: string | undefined): DayOfWeek {
  return WEEK_DAYS.includes(value as DayOfWeek)
    ? (value as DayOfWeek)
    : "monday";
}

const SECTION_ORDER = ["B", "A", "Other"] as const;

function sectionLabel(cls: { section: string | null }): string {
  const s = (cls.section ?? "").trim().toUpperCase();
  if (s === "B" || s === "A") return s;
  return "Other";
}

function timeRange(p?: { start_time: Date; end_time: Date } | null): string {
  return p ? `${formatTime(p.start_time)} – ${formatTime(p.end_time)}` : "—";
}

export async function MasterTimetable({
  day,
  hrefPrefix,
  days = MASTER_DAYS,
}: {
  day: DayOfWeek;
  hrefPrefix: string;
  days?: DayOfWeek[];
}) {
  const data = await getMasterDay(day);

  const flat = SECTION_ORDER.map((label) => ({
    label,
    classes: data.classes.filter((c) => sectionLabel(c) === label),
  }))
    .filter((g) => g.classes.length > 0)
    .flatMap((g) => g.classes.map((c) => ({ c, section: g.label })));

  const dayHref = (d: string) =>
    `${hrefPrefix}${hrefPrefix.includes("?") ? "&" : "?"}day=${d}`;

  const entryFor = (classIndex: number, slotNumber: number) => {
    const pid = data.slotPeriodId[slotNumber];
    return pid != null ? data.grid[flat[classIndex].c.id]?.[pid] ?? null : null;
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-6 no-print">
        {days.map((d) => (
          <Link
            key={d}
            href={dayHref(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              day === d
                ? "bg-brand-500 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {MASTER_DAY_LABELS[d]}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h2 className="font-semibold text-slate-900">
            {MASTER_DAY_LABELS[day]} — Master schedule
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {day === "friday"
              ? "Friday timings (shorter periods)"
              : "Monday–Thursday timings"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th className="min-w-[140px]">Class</th>
                {data.slots.map((s) => (
                  <th key={s.period_number} className="min-w-[88px]">
                    <span className="block font-semibold">
                      {s.period_number === 0 ? "0 · Assembly" : s.period_number}
                    </span>
                    {s.name && s.period_number !== 0 ? (
                      <span className="block text-xs font-normal text-slate-400">
                        {s.name}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="text-xs font-normal text-slate-500 whitespace-nowrap">
                  Mon–Thu time
                </th>
                {data.slots.map((s) => (
                  <th
                    key={s.period_number}
                    className="text-xs font-normal text-slate-400 whitespace-nowrap"
                  >
                    {timeRange(s.monThu)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="text-xs font-normal text-slate-500 whitespace-nowrap">
                  Friday time
                </th>
                {data.slots.map((s) => (
                  <th
                    key={s.period_number}
                    className="text-xs font-normal text-slate-400 whitespace-nowrap"
                  >
                    {timeRange(s.friday)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="text-xs font-normal text-slate-500 whitespace-nowrap">
                  Saturday time
                </th>
                {data.slots.map((s) => (
                  <th
                    key={s.period_number}
                    className="text-xs font-normal text-slate-400 whitespace-nowrap"
                  >
                    {timeRange(s.saturday)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flat.map(({ c, section }, fi) => {
                const firstInSection = fi === 0 || flat[fi - 1].section !== section;
                return (
                  <tr key={c.id}>
                    <td className="align-top">
                      {firstInSection ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {section === "Other" ? "Other" : `${section} Section`}
                        </p>
                      ) : null}
                      <p className="font-semibold text-slate-900">Class {c.name}</p>
                      <p className="text-xs text-slate-500">{c.program ?? "—"}</p>
                      {c.class_teacher ? (
                        <p className="text-xs text-slate-400">
                          CT: {c.class_teacher.name}
                        </p>
                      ) : null}
                    </td>
                    {data.slots.map((s) => {
                      const entry = entryFor(fi, s.period_number);
                      if (!entry) {
                        return (
                          <td key={s.period_number} className="align-top">
                            <span className="text-slate-300">—</span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={s.period_number}
                          className={`align-top ${cellToneClass(entry)}`}
                        >
                          <TimetableCell entry={entry as NonNullable<TimetableCellEntry>} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}