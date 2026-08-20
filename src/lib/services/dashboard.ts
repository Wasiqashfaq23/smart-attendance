import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  const today = new Date();
  const dayStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const [
    teacherCount,
    classCount,
    subjectCount,
    periodCount,
    timetableCount,
    absencesToday,
    pendingSubs,
    assignedSubs,
    unassignedAbsences,
    recentAudit,
  ] = await Promise.all([
    prisma.teacher.count({ where: { status: "active" } }),
    prisma.classRoom.count({ where: { status: "active" } }),
    prisma.subject.count({ where: { status: "active" } }),
    prisma.period.count({ where: { is_active: true } }),
    prisma.timetable.count({ where: { is_active: true } }),
    prisma.teacherAbsence.count({
      where: { date: dayStart, status: "absent" },
    }),
    prisma.substitution.count({ where: { status: "pending" } }),
    prisma.substitution.count({ where: { status: "assigned" } }),
    prisma.substitution.count({ where: { status: "pending", substitute_teacher_id: null } }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
  ]);

  return {
    teacherCount,
    classCount,
    subjectCount,
    periodCount,
    timetableCount,
    absencesToday,
    pendingSubs,
    assignedSubs,
    unassignedAbsences,
    recentAudit,
  };
}