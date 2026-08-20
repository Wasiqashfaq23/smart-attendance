import { prisma } from "@/lib/db";
import { SubstitutionManager } from "@/components/managers/SubstitutionManager";

export const dynamic = "force-dynamic";

export default async function SubstitutionsPage() {
  const [substitutions, teachers] = await Promise.all([
    prisma.substitution.findMany({
      include: {
        class: true,
        subject: true,
        period: true,
        original_teacher: true,
        substitute_teacher: true,
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
    prisma.teacher.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <SubstitutionManager substitutions={substitutions} teachers={teachers} />
  );
}