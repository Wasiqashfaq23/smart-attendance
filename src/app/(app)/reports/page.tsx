import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  getClassWeekly,
  getTeacherWeekly,
  getDailySheet,
  getWorkload,
} from "@/lib/services/report";
import { TimetableGrid } from "@/components/TimetableGrid";
import { PageHeader, Badge } from "@/components/ui";
import { PrintButton, SelectNav, DateNav } from "@/components/ReportControls";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "class", label: "Class schedule" },
  { key: "teacher", label: "Teacher schedule" },
  { key: "daily", label: "Daily sheet" },
  { key: "workload", label: "Workload" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    class?: string;
    teacher?: string;
    date?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = tabs.some((t) => t.key === sp.tab) ? sp.tab! : "class";

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Weekly schedules, daily sheets and workload"
        actions={<PrintButton />}
      />

      <div className="flex gap-1.5 mb-6 no-print">
        {tabs.map((t) => {
          const params = new URLSearchParams();
          params.set("tab", t.key);
          return (
            <Link
              key={t.key}
              href={`/reports?${params.toString()}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.key
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "class" && <ClassTab sp={sp} />}
      {tab === "teacher" && <TeacherTab sp={sp} />}
      {tab === "daily" && <DailyTab sp={sp} />}
      {tab === "workload" && <WorkloadTab />}
    </div>
  );
}

async function ClassTab({ sp }: { sp: Record<string, string | undefined> }) {
  const classes = await prisma.classRoom.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
  const classId = Number(sp.class) || classes[0]?.id || 0;
  const data = classId ? await getClassWeekly(classId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 no-print">
        <SelectNav
          name="class"
          value={classId}
          tab="class"
          options={classes.map((c) => ({ id: c.id, label: `Class ${c.name}` }))}
        />
      </div>
      {data ? (
        <TimetableGrid
          days={data.days}
          periods={data.periods}
          grid={data.grid}
          title={`Class ${data.classRoom.name} — Weekly schedule`}
          subtitle={`${data.classRoom.program ?? "—"} · Section ${data.classRoom.section ?? "—"}`}
        />
      ) : (
        <p className="text-slate-500">No classes configured yet.</p>
      )}
    </div>
  );
}

async function TeacherTab({ sp }: { sp: Record<string, string | undefined> }) {
  const teachers = await prisma.teacher.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
  const teacherId = Number(sp.teacher) || teachers[0]?.id || 0;
  const data = teacherId ? await getTeacherWeekly(teacherId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 no-print">
        <SelectNav
          name="teacher"
          value={teacherId}
          tab="teacher"
          options={teachers.map((t) => ({ id: t.id, label: t.name }))}
        />
      </div>
      {data ? (
        <TimetableGrid
          days={data.days}
          periods={data.periods}
          grid={data.grid}
          title={`${data.teacher.name} — Weekly schedule`}
          subtitle={data.teacher.department ?? undefined}
        />
      ) : (
        <p className="text-slate-500">No teachers configured yet.</p>
      )}
    </div>
  );
}

async function DailyTab({ sp }: { sp: Record<string, string | undefined> }) {
  const dateStr = sp.date ?? new Date().toISOString().slice(0, 10);
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const data = await getDailySheet(date);
  const dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getUTCDay()];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 no-print">
        <DateNav value={dateStr} tab="daily" />
      </div>

      {data.absences.length > 0 ? (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3">
            Absences on {dateStr} ({dayName})
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.absences.map((a) => (
              <Badge key={a.id} tone="red">
                {a.teacher.name}
                {a.reason ? ` — ${a.reason}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h2 className="font-semibold text-slate-900">Daily sheet — {dayName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th className="min-w-[90px]">Period</th>
                {data.classes.map((c) => (
                  <th key={c.id} className="min-w-[150px]">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.periods.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">
                    <span className="font-semibold text-slate-800">
                      P{p.period_number}
                    </span>
                  </td>
                  {data.classes.map((c) => {
                    const cell = data.grid[c.id]?.[p.id];
                    return (
                      <td key={c.id} className="align-top">
                        {cell ? (
                          <div>
                            <p className="font-medium text-slate-800 leading-snug">
                              {cell.subject.short_name ?? cell.subject.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {cell.teacher?.name ?? (
                                <span className="text-amber-600">No teacher</span>
                              )}
                            </p>
                            {cell.substitution ? (
                              <p
                                className={`text-xs mt-0.5 ${
                                  cell.substitution.status === "assigned"
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {cell.substitution.status === "assigned"
                                  ? `Covered by ${cell.substitution.substitute_teacher?.name}`
                                  : "Needs coverage"}
                              </p>
                            ) : cell.is_covered === false ? (
                              <p className="text-xs text-red-600 mt-0.5">
                                Teacher absent — uncovered
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

async function WorkloadTab() {
  const rows = await getWorkload();
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
  const dayShort: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Teacher workload</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Classes per day, total per week, and pending substitutions
        </p>
      </div>
      <table className="tbl w-full">
        <thead>
          <tr>
            <th>Teacher</th>
            {days.map((d) => (
              <th key={d}>{dayShort[d]}</th>
            ))}
            <th>Total</th>
            <th>Pending subs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.teacher.id}>
              <td className="font-medium">{r.teacher.name}</td>
              {days.map((d) => (
                <td key={d} className="text-slate-500">
                  {r.days[d] ?? 0}
                </td>
              ))}
              <td className="font-semibold">{r.total}</td>
              <td>
                {r.pending_substitutions > 0 ? (
                  <Badge tone="amber">{r.pending_substitutions}</Badge>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}