import { prisma } from "@/lib/db";
import { AbsenceManager } from "@/components/managers/AbsenceManager";

export const dynamic = "force-dynamic";

export default async function AbsencesPage() {
  const [absences, teachers] = await Promise.all([
    prisma.teacherAbsence.findMany({
      include: { teacher: true },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
    prisma.teacher.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
  ]);
  return <AbsenceManager absences={absences} teachers={teachers} />;
}