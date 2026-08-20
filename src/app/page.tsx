import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClassWeekly } from "@/lib/services/report";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ClassPicker } from "@/components/ClassPicker";
import { PrintButton } from "@/components/ReportControls";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const [settings, classes] = await Promise.all([
    prisma.setting.findFirst(),
    prisma.classRoom.findMany({
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
              ST
            </div>
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
            <h1 className="text-2xl font-bold text-slate-900">
              Weekly Timetable
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Public read-only schedule. Sign in to edit.
            </p>
          </div>
          <div className="flex items-center gap-3 no-print">
            {data ? (
              <ClassPicker
                classes={classes.map((c) => ({ id: c.id, name: c.name }))}
                current={classId}
              />
            ) : null}
            <PrintButton />
          </div>
        </div>

        {data ? (
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