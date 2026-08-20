import { prisma } from "@/lib/db";
import { weekdayOf } from "@/lib/services/substitution";
import type { DayOfWeek, Prisma } from "@prisma/client";

type WeekEntry = {
  id: number;
  day: DayOfWeek;
  period_id: number;
  teacher_id: number | null;
  subject?: { name: string; short_name: string | null } | null;
  teacher?: { name: string } | null;
  class?: { name: string } | null;
  room?: string | null;
  notes?: string | null;
};

type WeekGrid = Record<string, Record<number, WeekEntry | null>>;

type DailyEntry = Prisma.TimetableGetPayload<{
  include: { subject: true; teacher: true; class: true };
}> & {
  is_covered: boolean;
  substitution: {
    status: string;
    substitute_teacher: { id: number; name: string } | null;
  } | null;
};

type DailyGrid = Record<number, Record<number, DailyEntry | undefined>>;

export async function getClassWeekly(classId: number) {
  const classRoom = await prisma.classRoom.findUnique({
    where: { id: classId },
  });
  if (!classRoom) return null;

  const periods = await prisma.period.findMany({
    where: { is_active: true },
    orderBy: [{ applicable_day_type: "asc" }, { period_number: "asc" }],
  });

  const entries = await prisma.timetable.findMany({
    where: { class_id: classId, is_active: true },
    include: { subject: true, teacher: true, period: true },
  });

  const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  const grid: WeekGrid = {};
  for (const day of days) {
    grid[day] = {};
    const type: "mon_thu" | "friday" = day === "friday" ? "friday" : "mon_thu";
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
}

export async function getTeacherWeekly(teacherId: number) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });
  if (!teacher) return null;

  const periods = await prisma.period.findMany({
    where: { is_active: true },
    orderBy: [{ applicable_day_type: "asc" }, { period_number: "asc" }],
  });

  const entries = await prisma.timetable.findMany({
    where: { teacher_id: teacherId, is_active: true },
    include: { subject: true, class: true, period: true },
  });

  const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const grid: WeekGrid = {};
  for (const day of days) {
    grid[day] = {};
    const type: "mon_thu" | "friday" = day === "friday" ? "friday" : "mon_thu";
    for (const p of periods) {
      if (p.applicable_day_type === type) grid[day][p.id] = null;
    }
  }
  for (const e of entries) {
    if (grid[e.day] && grid[e.day][e.period_id] !== undefined) {
      grid[e.day][e.period_id] = e;
    }
  }

  return { teacher, periods, grid, days };
}

export async function getDailySheet(date: Date) {
  const day = weekdayOf(date);
  const type: "mon_thu" | "friday" = day === "friday" ? "friday" : "mon_thu";

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
    include: { subject: true, teacher: true, class: true },
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

  const byTeacher: Record<number, Record<string, number>> = {};
  for (const g of all) {
    if (!g.teacher_id) continue;
    byTeacher[g.teacher_id] ??= {};
    byTeacher[g.teacher_id][g.day] = g._count._all;
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