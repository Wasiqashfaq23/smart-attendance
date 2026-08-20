import Link from "next/link";
import {
  Users,
  School,
  BookOpen,
  Clock,
  CalendarDays,
  Stethoscope,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Teachers",
      value: stats.teacherCount,
      icon: Users,
      href: "/teachers",
      tone: "text-brand-500 bg-brand-50",
    },
    {
      label: "Classes",
      value: stats.classCount,
      icon: School,
      href: "/classes",
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Subjects",
      value: stats.subjectCount,
      icon: BookOpen,
      href: "/subjects",
      tone: "text-violet-600 bg-violet-50",
    },
    {
      label: "Periods",
      value: stats.periodCount,
      icon: Clock,
      href: "/periods",
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Timetable slots",
      value: stats.timetableCount,
      icon: CalendarDays,
      href: "/timetable",
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "Absences today",
      value: stats.absencesToday,
      icon: Stethoscope,
      href: "/absences",
      tone: "text-red-600 bg-red-50",
    },
    {
      label: "Pending substitutions",
      value: stats.pendingSubs,
      icon: UserCheck,
      href: "/substitutions",
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Unassigned coverage",
      value: stats.unassignedAbsences,
      icon: AlertTriangle,
      href: "/substitutions",
      tone: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the timetable system"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="card p-5 hover:shadow-lg transition"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.tone}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
        </div>
        {stats.recentAudit.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No activity recorded yet.
          </p>
        ) : (
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAudit.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.user}</td>
                  <td>
                    <Badge tone="blue">{a.action}</Badge>
                  </td>
                  <td className="text-slate-500">
                    {a.entity}
                    <span className="text-slate-400"> #{a.entity_id}</span>
                  </td>
                  <td className="text-slate-500">{a.description ?? "—"}</td>
                  <td className="text-slate-400 whitespace-nowrap">
                    {a.timestamp.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}