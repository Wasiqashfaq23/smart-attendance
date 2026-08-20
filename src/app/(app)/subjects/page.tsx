import { prisma } from "@/lib/db";
import { SubjectManager } from "@/components/managers/SubjectManager";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
  });
  return <SubjectManager subjects={subjects} />;
}