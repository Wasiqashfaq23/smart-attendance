import { prisma } from "@/lib/db";
import type { DayOfWeek } from "@prisma/client";

export type Recommendation = {
  teacher_id: number;
  teacher_name: string;
  department: string | null;
  score: number;
  reasons: string[];
};

export async function recommendSubstitutes(
  originalTeacherId: number,
  date: Date,
  periodId: number,
  limit = 5
): Promise<Recommendation[]> {
  const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    date.getUTCDay()
  ] as DayOfWeek;

  const busyIds = new Set<number>();
  const entriesAtPeriod = await prisma.timetable.findMany({
    where: { day: weekday, period_id: periodId, is_active: true },
  });
  for (const e of entriesAtPeriod) {
    if (e.teacher_id) busyIds.add(e.teacher_id);
  }

  const alreadyAssigned = await prisma.substitution.findMany({
    where: {
      date,
      period_id: periodId,
      status: { in: ["pending", "assigned"] },
      substitute_teacher_id: { not: null },
    },
  });
  for (const s of alreadyAssigned) {
    if (s.substitute_teacher_id) busyIds.add(s.substitute_teacher_id);
  }

  const teachers = await prisma.teacher.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });

  const availabilityRows = await prisma.teacherAvailability.findMany({
    where: { day: weekday },
  });
  const availabilityByTeacher = new Map<number, boolean>();
  for (const a of availabilityRows) {
    if (a.period_id === periodId) availabilityByTeacher.set(a.teacher_id, a.is_available);
  }

  const workloadByTeacher = new Map<number, number>();
  const classesByTeacher = await prisma.timetable.groupBy({
    by: ["teacher_id"],
    where: { day: weekday, is_active: true, teacher_id: { not: null } },
    _count: { _all: true },
  });
  for (const g of classesByTeacher) {
    workloadByTeacher.set(g.teacher_id!, g._count._all);
  }

  const todaySubCounts = await prisma.substitution.groupBy({
    by: ["substitute_teacher_id"],
    where: { date, substitute_teacher_id: { not: null } },
    _count: { _all: true },
  });
  const todaySubsByTeacher = new Map<number, number>();
  for (const g of todaySubCounts) {
    todaySubsByTeacher.set(g.substitute_teacher_id!, g._count._all);
  }

  const original = await prisma.teacher.findUnique({ where: { id: originalTeacherId } });

  const results: Recommendation[] = [];
  for (const t of teachers) {
    if (t.id === originalTeacherId) continue;
    if (busyIds.has(t.id)) continue;
    const avail = availabilityByTeacher.get(t.id);
    if (avail === false) continue;

    let score = 50;
    const reasons: string[] = [];

    const workload = workloadByTeacher.get(t.id) ?? 0;
    if (workload <= 2) {
      score += 15;
      reasons.push("Low workload on this day");
    } else if (workload >= 6) {
      score -= 10;
      reasons.push("High workload on this day");
    }

    const todaySubs = todaySubsByTeacher.get(t.id) ?? 0;
    if (todaySubs > 0) {
      score -= 5 * todaySubs;
      reasons.push(`Already covering ${todaySubs} substitution(s) today`);
    }

    if (avail === true) {
      score += 10;
      reasons.push("Marked available for this period");
    }

    if (original && original.department && t.department === original.department) {
      score += 8;
      reasons.push("Same department");
    }

    results.push({
      teacher_id: t.id,
      teacher_name: t.name,
      department: t.department,
      score,
      reasons,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}