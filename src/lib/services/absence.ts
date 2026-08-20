import { prisma } from "@/lib/db";
import { createSubstitutionsForAbsence } from "@/lib/services/substitution";

export async function markTeacherAbsent(
  teacherId: number,
  date: Date,
  reason?: string | null,
  notes?: string | null
): Promise<{ absenceId: number; substitutionsCreated: number }> {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  const existing = await prisma.teacherAbsence.findFirst({
    where: {
      teacher_id: teacherId,
      date: dayStart,
    },
  });
  if (existing) {
    return { absenceId: existing.id, substitutionsCreated: 0 };
  }

  const absence = await prisma.teacherAbsence.create({
    data: {
      teacher_id: teacherId,
      date: dayStart,
      reason: reason ?? null,
      notes: notes ?? null,
      status: "absent",
    },
  });

  const created = await createSubstitutionsForAbsence(absence.id);
  return { absenceId: absence.id, substitutionsCreated: created };
}

export async function cancelAbsence(absenceId: number): Promise<number> {
  const absence = await prisma.teacherAbsence.findUnique({
    where: { id: absenceId },
  });
  if (!absence) throw new Error("Absence not found");

  await prisma.teacherAbsence.update({
    where: { id: absenceId },
    data: { status: "cancelled" },
  });

  const updated = await prisma.substitution.updateMany({
    where: { absence_id: absenceId, status: "pending" },
    data: { status: "cancelled" },
  });
  return updated.count;
}

export async function reactivateAbsence(absenceId: number): Promise<number> {
  const absence = await prisma.teacherAbsence.findUnique({
    where: { id: absenceId },
  });
  if (!absence) throw new Error("Absence not found");

  await prisma.teacherAbsence.update({
    where: { id: absenceId },
    data: { status: "absent" },
  });
  return createSubstitutionsForAbsence(absenceId);
}