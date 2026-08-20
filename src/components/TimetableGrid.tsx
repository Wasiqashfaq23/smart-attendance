import type { DayOfWeek, PeriodDayType } from "@prisma/client";
import { formatTime } from "@/lib/validation";
import { dayTypeFor, DAY_LABELS } from "@/lib/weekdays";
import {
  TimetableCell,
  cellToneClass,
  type TimetableCellEntry,
} from "@/components/TimetableCell";

export {
  combinedSubjectNames,
  combinedTeacherNames,
  isSpecialEntry,
  isBreakEntry,
  type TimetableCellEntry,
} from "@/components/TimetableCell";

type PeriodRow = {
  id: number;
  period_number: number;
  name?: string | null;
  is_special?: boolean;
  start_time: Date;
  end_time: Date;
  applicable_day_type: PeriodDayType;
};

type Slot = {
  period_number: number;
  label: string;
  extraLabel: string | null;
  monThu?: PeriodRow;
  friday?: PeriodRow;
  saturday?: PeriodRow;
};

function buildSlots(periods: PeriodRow[]): Slot[] {
  const byNumber = new Map<number, Slot>();
  const slots: Slot[] = [];
  for (const p of periods) {
    let s = byNumber.get(p.period_number);
    if (!s) {
      s = {
        period_number: p.period_number,
        label: "",
        extraLabel: null,
        monThu: undefined,
        friday: undefined,
        saturday: undefined,
      };
      byNumber.set(p.period_number, s);
      slots.push(s);
    }
    if (p.applicable_day_type === "friday") s.friday = p;
    else if (p.applicable_day_type === "saturday") s.saturday = p;
    else s.monThu = p;
  }
  slots.sort((a, b) => a.period_number - b.period_number);
  for (const s of slots) {
    const base = s.monThu ?? s.friday ?? s.saturday;
    if (s.period_number === 0) {
      s.label = "0";
      s.extraLabel = "Assembly";
    } else {
      s.label = String(s.period_number);
      if (base?.name && !/^p\d*$/i.test(base.name)) s.extraLabel = base.name;
    }
  }
  return slots;
}

function slotPeriod(s: Slot, day: DayOfWeek): PeriodRow | undefined {
  const want = dayTypeFor(day);
  if (want === "friday") return s.friday ?? s.monThu;
  if (want === "saturday") return s.saturday ?? s.monThu;
  return s.monThu ?? s.friday;
}

function timeRange(p?: PeriodRow): string {
  return p ? `${formatTime(p.start_time)} – ${formatTime(p.end_time)}` : "—";
}

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
  const dayLabels: Record<string, string> = DAY_LABELS;

  const slots = buildSlots(periods);

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
              <th className="min-w-[96px]">Day</th>
              {slots.map((s) => (
                <th key={s.period_number} className="min-w-[88px]">
                  <span className="block font-semibold">{s.label}</span>
                  {s.extraLabel ? (
                    <span className="block text-xs font-normal text-slate-400">
                      {s.extraLabel}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
            <tr>
              <th className="text-xs font-normal text-slate-500 whitespace-nowrap">
                Mon–Thu time
              </th>
              {slots.map((s) => (
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
              {slots.map((s) => (
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
              {slots.map((s) => (
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
            {days.map((d) => (
              <tr key={d}>
                <td className="whitespace-nowrap">
                  <span className="font-semibold text-slate-800">{dayLabels[d]}</span>
                </td>
                {slots.map((s) => {
                  const period = slotPeriod(s, d);
                  if (!period) {
                    return (
                      <td key={s.period_number}>
                        <span className="text-slate-300">—</span>
                      </td>
                    );
                  }
                  const entry = grid[d]?.[period.id] ?? null;
                  if (cellRenderer) {
                    return (
                      <td key={s.period_number}>{cellRenderer(d, period, entry)}</td>
                    );
                  }
                  if (entry) {
                    return (
                      <td
                        key={s.period_number}
                        className={`align-top ${cellToneClass(entry)}`}
                      >
                        <TimetableCell entry={entry} showTeacher={showTeacher} />
                      </td>
                    );
                  }
                  return (
                    <td key={s.period_number} className="align-top">
                      <span className="text-slate-300">—</span>
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