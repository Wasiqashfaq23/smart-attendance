import { prisma } from "@/lib/db";
import { ClassManager } from "@/components/managers/ClassManager";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await prisma.classRoom.findMany({
    orderBy: { name: "asc" },
  });
  return <ClassManager classes={classes} />;
}