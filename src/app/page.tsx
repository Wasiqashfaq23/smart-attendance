import Link from "next/link";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { getClassWeekly } from "@/lib/services/report";
import { getSetting, getActiveClasses } from "@/lib/queries";
import { activeDays } from "@/lib/weekdays";
import { TimetableGrid } from "@/components/TimetableGrid";
import { MasterTimetable, parseMasterDay } from "@/components/MasterTimetable";
import { ClassPicker } from "@/components/ClassPicker";
import { PrintButton } from "@/components/ReportControls";

const getPublicClassWeekly = unstable_cache(
  async (id: number, days: Parameters<typeof getClassWeekly>[1]) =>
    getClassWeekly(id, days),
  ["public-class-weekly"],
  { revalidate: 60, tags: ["timetable"] }
);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; class?: string; day?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const [settings, classes] = await Promise.all([getSetting(), getActiveClasses()]);

  const view = sp.view === "class" ? "class" : "master";
  const day = parseMasterDay(sp.day);
  const days = activeDays(settings?.working_days);

  const requested = Number(sp.class);
  const classId =
    classes.some((c) => c.id === requested) && requested > 0
      ? requested
      : classes[0]?.id ?? 0;

  const data =
    view === "class" && classId ? await getPublicClassWeekly(classId, days) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.school_logo ? (
              <img
                src={settings.school_logo}
                alt="School logo"
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
                ST
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                {settings?.school_name ?? "Smart Timetable"}
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                {settings?.academic_session ?? "Weekly Timetable"}
              </p>
            </div>
          </div>
          {session?.user ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Timetable</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Public read-only schedule. Sign in to edit.
            </p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
              <Link
                href="/?view=master"
                className={`px-4 py-2 text-sm font-medium transition ${
                  view === "master"
                    ? "bg-brand-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Master
              </Link>
              <Link
                href="/?view=class"
                className={`px-4 py-2 text-sm font-medium transition ${
                  view === "class"
                    ? "bg-brand-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Class
              </Link>
            </div>
            {data ? (
              <ClassPicker
                classes={classes.map((c) => ({ id: c.id, name: c.name }))}
                current={classId}
              />
            ) : null}
            <PrintButton />
          </div>
        </div>

        {view === "master" ? (
          <MasterTimetable day={day} days={days} hrefPrefix="/?view=master" />
        ) : data ? (
          <TimetableGrid
            days={data.days}
            periods={data.periods}
            grid={data.grid}
            title={`Class ${data.classRoom.name}`}
            subtitle={`${data.classRoom.program ?? "—"} · Section ${data.classRoom.section ?? "—"}`}
          />
        ) : (
          <div className="card p-10 text-center text-slate-500">
            No classes configured yet.
          </div>
        )}
      </main>
    </div>
  );
}