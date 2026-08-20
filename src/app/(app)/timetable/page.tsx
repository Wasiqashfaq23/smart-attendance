import { prisma } from "@/lib/db";
import { getClassWeekly } from "@/lib/services/report";
import { TimetableManager } from "@/components/managers/TimetableManager";

export const dynamic = "force-dynamic";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  const [classes, subjects, teachers] = await Promise.all([
    prisma.classRoom.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
  ]);

  const requested = Number(sp.class);
  const classId =
    classes.some((c) => c.id === requested) && requested > 0
      ? requested
      : classes[0]?.id ?? 0;

  const data = classId ? await getClassWeekly(classId) : null;

  if (!data) {
    return (
      <div className="card p-10 text-center text-slate-500">
        No classes configured yet.
      </div>
    );
  }

  return (
    <TimetableManager
      days={data.days}
      periods={data.periods}
      grid={data.grid}
      classes={classes}
      subjects={subjects}
      teachers={teachers}
    />
  );
}