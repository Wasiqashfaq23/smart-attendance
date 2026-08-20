import type { DayOfWeek } from "@prisma/client";
import { formatTime } from "@/lib/validation";

type PeriodRow = {
  id: number;
  period_number: number;
  start_time: Date;
  end_time: Date;
  applicable_day_type: "mon_thu" | "friday";
};

export type TimetableCellEntry = {
  id: number;
  day: DayOfWeek;
  period_id: number;
  subject?: { name: string; short_name: string | null } | null;
  teacher?: { name: string } | null;
  class?: { name: string } | null;
  room?: string | null;
  notes?: string | null;
} | null;

export function TimetableGrid({
  days,
  periods,
  grid,
  title,
  subtitle,
  showTeacher = true,
  cellRenderer,
}: {
  days: DayOfWeek[];
  periods: PeriodRow[];
  grid: Record<string, Record<number, TimetableCellEntry>>;
  title?: string;
  subtitle?: string;
  showTeacher?: boolean;
  cellRenderer?: (day: DayOfWeek, period: PeriodRow, entry: TimetableCellEntry) => React.ReactNode;
}) {
  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
  };

  return (
    <div className="card overflow-hidden">
      {(title || subtitle) && (
        <div className="px-5 pt-5 pb-1">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="tbl w-full">
          <thead>
            <tr>
              <th className="min-w-[110px]">Period</th>
              {days.map((d) => (
                <th key={d} className="min-w-[140px]">
                  {dayLabels[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">
                  <span className="font-semibold text-slate-800">
                    P{p.period_number}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {formatTime(p.start_time)} – {formatTime(p.end_time)}
                  </span>
                </td>
                {days.map((d) => {
                  const entry = grid[d]?.[p.id] ?? null;
                  if (cellRenderer) {
                    return (
                      <td key={d}>
                        {cellRenderer(d, p, entry)}
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="align-top">
                      {entry ? (
                        <div>
                          <p className="font-medium text-slate-800 leading-snug">
                            {entry.subject?.short_name ?? entry.subject?.name ?? "—"}
                          </p>
                          {showTeacher && entry.teacher ? (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {entry.teacher.name}
                            </p>
                          ) : null}
                          {entry.room ? (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Room {entry.room}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}