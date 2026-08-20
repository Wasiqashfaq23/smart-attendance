import { prisma } from "@/lib/db";
import { ClassManager } from "@/components/managers/ClassManager";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [classes, teachers] = await Promise.all([
    prisma.classRoom.findMany({
      orderBy: { name: "asc" },
      include: { class_teacher: true },
    }),
    prisma.teacher.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
  ]);
  return <ClassManager classes={classes} teachers={teachers} />;
}