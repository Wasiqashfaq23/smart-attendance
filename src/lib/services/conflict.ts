import { prisma } from "@/lib/db";
import type { DayOfWeek } from "@prisma/client";

export type Conflict = {
  type: "teacher" | "class" | "self";
  message: string;
};

export async function findTeacherConflicts(
  day: DayOfWeek,
  periodId: number,
  teacherId: number,
  excludeTimetableId?: number
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  const sameTeacher = await prisma.timetable.findMany({
    where: {
      day,
      period_id: periodId,
      teacher_id: teacherId,
      is_active: true,
      id: excludeTimetableId ? { not: excludeTimetableId } : undefined,
    },
    include: { class: true },
  });
  for (const t of sameTeacher) {
    conflicts.push({
      type: "teacher",
      message: `${t.class.name} already has this teacher at the same time`,
    });
  }

  return conflicts;
}

export async function findClassConflict(
  day: DayOfWeek,
  periodId: number,
  classId: number,
  excludeTimetableId?: number
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];
  const existing = await prisma.timetable.findFirst({
    where: {
      day,
      period_id: periodId,
      class_id: classId,
      id: excludeTimetableId ? { not: excludeTimetableId } : undefined,
    },
  });
  if (existing) {
    conflicts.push({
      type: "class",
      message: "This class already has an entry for that day and period",
    });
  }
  return conflicts;
}

export async function checkTimetableEntry(
  input: {
    day: DayOfWeek;
    periodId: number;
    classId: number;
    teacherIds: number[];
  },
  excludeTimetableId?: number
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  const classConflicts = await findClassConflict(
    input.day,
    input.periodId,
    input.classId,
    excludeTimetableId
  );
  conflicts.push(...classConflicts);

  for (const teacherId of input.teacherIds) {
    const teacherConflicts = await findTeacherConflicts(
      input.day,
      input.periodId,
      teacherId,
      excludeTimetableId
    );
    conflicts.push(...teacherConflicts);
  }

  if (input.teacherIds.length > 0) {
    const coConflicts = await prisma.timetableTeacher.findMany({
      where: {
        teacher_id: { in: input.teacherIds },
        timetable: {
          day: input.day,
          period_id: input.periodId,
          is_active: true,
          id: excludeTimetableId ? { not: excludeTimetableId } : undefined,
        },
      },
      include: { timetable: { include: { class: true } } },
    });
    for (const cc of coConflicts) {
      if (input.teacherIds.includes(cc.teacher_id)) {
        conflicts.push({
          type: "teacher",
          message: `${cc.timetable.class.name} already has this teacher (co-teacher) at the same time`,
        });
      }
    }
  }

  return conflicts;
}

export async function canAssignSubstitute(
  date: Date,
  periodId: number,
  substituteTeacherId: number,
  originalTeacherId: number
): Promise<{ ok: boolean; reason?: string }> {
  if (substituteTeacherId === originalTeacherId) {
    return { ok: false, reason: "Cannot assign the original teacher as substitute" };
  }

  const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    date.getUTCDay()
  ] as DayOfWeek;

  const busyAtPeriod = await prisma.timetable.findFirst({
    where: {
      day: weekday,
      period_id: periodId,
      teacher_id: substituteTeacherId,
      is_active: true,
    },
  });
  if (busyAtPeriod) {
    return {
      ok: false,
      reason: `${substituteTeacherId ? "" : ""}This teacher is already teaching at that period`,
    };
  }

  const sameDateSub = await prisma.substitution.findFirst({
    where: {
      date,
      period_id: periodId,
      substitute_teacher_id: substituteTeacherId,
      status: { in: ["pending", "assigned"] },
    },
  });
  if (sameDateSub) {
    return { ok: false, reason: "This teacher already has a substitution at that period" };
  }

  const availability = await prisma.teacherAvailability.findUnique({
    where: {
      teacher_id_day_period_id: {
        teacher_id: substituteTeacherId,
        day: weekday,
        period_id: periodId,
      },
    },
  });
  if (availability && !availability.is_available) {
    return { ok: false, reason: "Teacher marked unavailable at this period" };
  }

  return { ok: true };
}