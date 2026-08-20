import type { DayOfWeek, PeriodDayType } from "@prisma/client";

export const WEEK_DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function dayTypeFor(day: DayOfWeek): PeriodDayType {
  if (day === "friday") return "friday";
  if (day === "saturday") return "saturday";
  return "mon_thu";
}

export function isWorkingDay(
  day: DayOfWeek,
  workingDays?: string | null
): boolean {
  if (!workingDays) return true;
  const active = workingDays
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return active.includes(day);
}

export function activeDays(workingDays?: string | null): DayOfWeek[] {
  return WEEK_DAYS.filter((d) => isWorkingDay(d, workingDays));
}