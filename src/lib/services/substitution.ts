import { prisma } from "@/lib/db";
import type { DayOfWeek } from "@prisma/client";
import { canAssignSubstitute } from "@/lib/services/conflict";

export function weekdayOf(date: Date): DayOfWeek {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    date.getUTCDay()
  ] as DayOfWeek;
}

export async function createSubstitutionsForAbsence(absenceId: number): Promise<number> {
  const absence = await prisma.teacherAbsence.findUnique({
    where: { id: absenceId },
  });
  if (!absence) throw new Error("Absence not found");
  if (absence.status === "cancelled") return 0;

  const day = weekdayOf(absence.date);
  const entries = await prisma.timetable.findMany({
    where: { day, teacher_id: absence.teacher_id, is_active: true },
  });

  let created = 0;
  for (const entry of entries) {
    const existing = await prisma.substitution.findFirst({
      where: {
        absence_id: absenceId,
        date: absence.date,
        period_id: entry.period_id,
        class_id: entry.class_id,
      },
    });
    if (existing) continue;

    await prisma.substitution.create({
      data: {
        absence_id: absenceId,
        timetable_id: entry.id,
        original_teacher_id: absence.teacher_id,
        substitute_teacher_id: null,
        date: absence.date,
        period_id: entry.period_id,
        class_id: entry.class_id,
        subject_id: entry.subject_id,
        status: "pending",
        notes: "Auto-created from absence",
      },
    });
    created++;
  }
  return created;
}

export async function assignSubstitute(
  substitutionId: number,
  substituteTeacherId: number,
  notes?: string | null
): Promise<{ ok: boolean; message?: string }> {
  const sub = await prisma.substitution.findUnique({
    where: { id: substitutionId },
  });
  if (!sub) return { ok: false, message: "Substitution not found" };
  if (sub.status === "cancelled") return { ok: false, message: "Substitution is cancelled" };
  if (sub.status === "assigned" && sub.substitute_teacher_id === substituteTeacherId) {
    return { ok: false, message: "Already assigned to this teacher" };
  }

  const check = await canAssignSubstitute(
    sub.date,
    sub.period_id,
    substituteTeacherId,
    sub.original_teacher_id
  );
  if (!check.ok) return { ok: false, message: check.reason };

  await prisma.substitution.update({
    where: { id: substitutionId },
    data: {
      substitute_teacher_id: substituteTeacherId,
      status: "assigned",
      notes: notes ?? sub.notes,
    },
  });
  return { ok: true };
}

export async function cancelSubstitution(
  substitutionId: number,
  notes?: string | null
): Promise<{ ok: boolean; message?: string }> {
  const sub = await prisma.substitution.findUnique({
    where: { id: substitutionId },
  });
  if (!sub) return { ok: false, message: "Substitution not found" };
  if (sub.status === "cancelled") return { ok: false, message: "Already cancelled" };

  await prisma.substitution.update({
    where: { id: substitutionId },
    data: {
      status: "cancelled",
      notes: notes ?? sub.notes,
    },
  });
  return { ok: true };
}