import { getClassWeekly } from "@/lib/services/report";
import { getActiveClasses, getActiveTeachers, getActiveSubjects, getSetting } from "@/lib/queries";
import { activeDays } from "@/lib/weekdays";
import { TimetableManager } from "@/components/managers/TimetableManager";

export const dynamic = "force-dynamic";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  const [classes, subjects, teachers, settings] = await Promise.all([
    getActiveClasses(),
    getActiveSubjects(),
    getActiveTeachers(),
    getSetting(),
  ]);

  const requested = Number(sp.class);
  const classId =
    classes.some((c) => c.id === requested) && requested > 0
      ? requested
      : classes[0]?.id ?? 0;

  const days = activeDays(settings?.working_days);
  const data = classId ? await getClassWeekly(classId, days) : null;

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