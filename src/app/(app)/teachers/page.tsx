import { prisma } from "@/lib/db";
import { TeacherManager } from "@/components/managers/TeacherManager";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });
  return <TeacherManager teachers={teachers} />;
}