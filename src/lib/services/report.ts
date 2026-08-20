import { prisma } from "@/lib/db";
import { weekdayOf } from "@/lib/services/substitution";
import { getActivePeriods } from "@/lib/queries";
import { dayTypeFor, WEEK_DAYS } from "@/lib/weekdays";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { DayOfWeek, Prisma } from "@prisma/client";

type WeekEntry = {
  id: number;
  day: DayOfWeek;
  period_id: number;
  teacher_id: number | null;
  subject?: { name: string; short_name: string | null; is_special?: boolean } | null;
  teacher?: { name: string } | null;
  class?: { name: string } | null;
  room?: string | null;
  notes?: string | null;
  additionalSubjects?: {
    subject: { name: string; short_name: string | null; is_special?: boolean };
  }[];
  additionalTeachers?: { teacher: { name: string } }[];
};

type WeekGrid = Record<string, Record<number, WeekEntry | null>>;

type DailyEntry = Prisma.TimetableGetPayload<{
  include: {
    subject: true;
    teacher: true;
    class: true;
    additionalSubjects: { include: { subject: true } };
    additionalTeachers: { include: { teacher: true } };
  };
}> & {
  is_covered: boolean;
  substitution: {
    status: string;
    substitute_teacher: { id: number; name: string } | null;
  } | null;
};

type DailyGrid = Record<number, Record<number, DailyEntry | undefined>>;

const EXTRA_INCLUDE = {
  additionalSubjects: { include: { subject: true } },
  additionalTeachers: { include: { teacher: true } },
} as const;

export const getClassWeekly = cache(async function getClassWeekly(
  classId: number,
  days: DayOfWeek[] = WEEK_DAYS
) {
  const [classRoom, periods, entries] = await Promise.all([
    prisma.classRoom.findUnique({ where: { id: classId } }),
    getActivePeriods(),
    prisma.timetable.findMany({
      where: { class_id: classId, is_active: true },
      include: { subject: true, teacher: true, period: true, ...EXTRA_INCLUDE },
    }),
  ]);
  if (!classRoom) return null;

  const grid: WeekGrid = {};
  for (const day of days) {
    grid[day] = {};
    const type = dayTypeFor(day);
    for (const p of periods) {
      if (p.applicable_day_type === type) grid[day][p.id] = null;
    }
  }
  for (const e of entries) {
    if (grid[e.day] && grid[e.day][e.period_id] !== undefined) {
      grid[e.day][e.period_id] = e;
    }
  }

  return { classRoom, periods, grid, days };
});

export async function getTeacherWeekly(
  teacherId: number,
  days: DayOfWeek[] = WEEK_DAYS
) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });
  if (!teacher) return null;

  const periods = await getActivePeriods();

  const [primaryEntries, coEntries] = await Promise.all([
    prisma.timetable.findMany({
      where: { teacher_id: teacherId, is_active: true },
      include: { subject: true, class: true, period: true, ...EXTRA_INCLUDE },
    }),
    prisma.timetable.findMany({
      where: { is_active: true, additionalTeachers: { some: { teacher_id: teacherId } } },
      include: { subject: true, class: true, period: true, ...EXTRA_INCLUDE },
    }),
  ]);

  const grid: WeekGrid = {};
  for (const day of days) {
    grid[day] = {};
    const type = dayTypeFor(day);
    for (const p of periods) {
      if (p.applicable_day_type === type) grid[day][p.id] = null;
    }
  }
  const merge = (list: typeof primaryEntries) => {
    for (const e of list) {
      const cell = grid[e.day]?.[e.period_id];
      if (cell === null) grid[e.day][e.period_id] = e;
    }
  };
  merge(primaryEntries);
  merge(coEntries);

  return { teacher, periods, grid, days };
}

export async function getDailySheet(date: Date) {
  const day = weekdayOf(date);
  const type = dayTypeFor(day);

  const classes = await prisma.classRoom.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
  const periods = await prisma.period.findMany({
    where: { is_active: true, applicable_day_type: type },
    orderBy: { period_number: "asc" },
  });
  const entries = await prisma.timetable.findMany({
    where: { day, is_active: true },
    include: { subject: true, teacher: true, class: true, ...EXTRA_INCLUDE },
  });

  const absences = await prisma.teacherAbsence.findMany({
    where: { date, status: "absent" },
    include: { teacher: true },
  });
  const absentTeacherIds = new Set(absences.map((a) => a.teacher_id));

  const substitutions = await prisma.substitution.findMany({
    where: {
      date,
      status: { in: ["pending", "assigned"] },
    },
    include: { substitute_teacher: true },
  });
  const subByClassPeriod = new Map<string, DailyEntry["substitution"]>();
  for (const s of substitutions) {
    subByClassPeriod.set(`${s.class_id}:${s.period_id}`, {
      status: s.status,
      substitute_teacher: s.substitute_teacher,
    });
  }

  const grid: DailyGrid = {};
  for (const c of classes) grid[c.id] = {};
  for (const e of entries) {
    grid[e.class_id][e.period_id] = {
      ...e,
      is_covered: e.teacher_id ? !absentTeacherIds.has(e.teacher_id) : true,
      substitution: subByClassPeriod.get(`${e.class_id}:${e.period_id}`) ?? null,
    };
  }

  return { date, day, classes, periods, grid, absences };
}

export type MasterSlot = {
  period_number: number;
  name: string | null;
  monThu: { id: number; start_time: Date; end_time: Date } | null;
  friday: { id: number; start_time: Date; end_time: Date } | null;
  saturday: { id: number; start_time: Date; end_time: Date } | null;
};

export const getMasterDay = unstable_cache(
  async function getMasterDay(day: DayOfWeek) {
    const type = dayTypeFor(day);

    const [classes, periods, allPeriods, entries] = await Promise.all([
      prisma.classRoom.findMany({
        where: { status: "active" },
        orderBy: [{ section: "asc" }, { name: "asc" }],
        include: { class_teacher: true },
      }),
      prisma.period.findMany({
        where: { is_active: true, applicable_day_type: type },
        orderBy: { period_number: "asc" },
      }),
      getActivePeriods(),
      prisma.timetable.findMany({
        where: { day, is_active: true },
        include: { subject: true, teacher: true, class: true, ...EXTRA_INCLUDE },
      }),
    ]);

    const slots: MasterSlot[] = [];
    const byNumber = new Map<number, MasterSlot>();
    for (const p of allPeriods) {
      let s = byNumber.get(p.period_number);
      if (!s) {
        s = {
          period_number: p.period_number,
          name: p.name,
          monThu: null,
          friday: null,
          saturday: null,
        };
        byNumber.set(p.period_number, s);
        slots.push(s);
      }
      if (p.applicable_day_type === "friday") s.friday = p;
      else if (p.applicable_day_type === "saturday") s.saturday = p;
      else s.monThu = p;
    }
    slots.sort((a, b) => a.period_number - b.period_number);

    const slotPeriodId = new Map<number, number>();
    for (const s of slots) {
      const p =
        type === "friday" ? s.friday : type === "saturday" ? s.saturday : s.monThu;
      if (p) slotPeriodId.set(s.period_number, p.id);
    }

    const grid: Record<number, Record<number, WeekEntry | null>> = {};
    for (const c of classes) grid[c.id] = {};
    for (const p of periods) {
      for (const c of classes) grid[c.id][p.id] = null;
    }
    for (const e of entries) {
      if (grid[e.class_id] && grid[e.class_id][e.period_id] !== undefined) {
        grid[e.class_id][e.period_id] = e;
      }
    }

    return { day, classes, periods, grid, slots, slotPeriodId };
  },
  ["master-day"],
  { revalidate: 60, tags: ["timetable"] }
);

export async function getWorkload() {
  const teachers = await prisma.teacher.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });

  const all = await prisma.timetable.groupBy({
    by: ["teacher_id", "day"],
    where: { is_active: true, teacher_id: { not: null } },
    _count: { _all: true },
  });

  const coRows = await prisma.timetable.findMany({
    where: { is_active: true, additionalTeachers: { some: {} } },
    select: { day: true, additionalTeachers: { select: { teacher_id: true } } },
  });

  const byTeacher: Record<number, Record<string, number>> = {};
  for (const g of all) {
    if (!g.teacher_id) continue;
    byTeacher[g.teacher_id] ??= {};
    byTeacher[g.teacher_id][g.day] = (byTeacher[g.teacher_id][g.day] ?? 0) + g._count._all;
  }
  for (const r of coRows) {
    for (const t of r.additionalTeachers) {
      byTeacher[t.teacher_id] ??= {};
      byTeacher[t.teacher_id][r.day] = (byTeacher[t.teacher_id][r.day] ?? 0) + 1;
    }
  }

  const pendingSubs = await prisma.substitution.groupBy({
    by: ["original_teacher_id"],
    where: { status: "pending" },
    _count: { _all: true },
  });
  const pendingByTeacher = new Map<number, number>();
  for (const g of pendingSubs) pendingByTeacher.set(g.original_teacher_id, g._count._all);

  const rows = teachers.map((t) => {
    const days = byTeacher[t.id] ?? {};
    const total = Object.values(days).reduce((a, b) => a + b, 0);
    return {
      teacher: t,
      days,
      total,
      pending_substitutions: pendingByTeacher.get(t.id) ?? 0,
    };
  });

  rows.sort((a, b) => b.total - a.total);
  return rows;
}