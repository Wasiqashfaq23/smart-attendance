import { useQuery } from "@tanstack/react-query";
import { getDashboard, getTimetable, getPeriods, getTeachers, getClasses, getSubjects } from "../utils/api";
import { formatTime, DAYS, DAY_LABELS, getStatusColor } from "../utils/helpers";
import { Loader } from "lucide-react";
import type { TeacherAbsence, Substitution } from "../types";

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const { data: periods = [] } = useQuery({
    queryKey: ["periods"],
    queryFn: getPeriods,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: () => getTimetable(),
  });

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const today = new Date();
  const todayDay = DAYS[today.getDay() - 1] || "monday";

  const safeTimetable = Array.isArray(timetable) ? timetable : [];
  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safePeriods = Array.isArray(periods) ? periods : [];
  const safeAbsences = Array.isArray(dashboard?.today_absences) ? dashboard.today_absences : [];
  const safeSubstitutions = Array.isArray(dashboard?.today_substitutions) ? dashboard.today_substitutions : [];

  const todayTimetable = safeTimetable.filter((t) => t.day === todayDay && t.is_active);
  const todayAbsences = safeAbsences;
  const todaySubstitutions = safeSubstitutions;

  const teacherMap = Object.fromEntries(safeTeachers.map((t) => [t.id, t]));
  const classMap = Object.fromEntries(safeClasses.map((c) => [c.id, c]));
  const subjectMap = Object.fromEntries(safeSubjects.map((s) => [s.id, s]));
  const periodMap = Object.fromEntries(safePeriods.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-600 mt-1">School Timetable Management System</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-500">Total Teachers</p>
          <h2 className="text-3xl font-bold text-brand-500 mt-2">{summary.total_teachers}</h2>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total Classes</p>
          <h2 className="text-3xl font-bold text-brand-500 mt-2">{summary.total_classes}</h2>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Absent Today</p>
          <h2 className="text-3xl font-bold text-red-500 mt-2">{summary.absent_teachers}</h2>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Pending Substitutions</p>
          <h2 className="text-3xl font-bold text-yellow-500 mt-2">{summary.pending_substitutions}</h2>
        </div>
      </div>

      {/* Today's Timetable */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Today's Schedule ({DAY_LABELS[todayDay]})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3">Period</th>
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-left py-2 px-3">Class</th>
                <th className="text-left py-2 px-3">Subject</th>
                <th className="text-left py-2 px-3">Teacher</th>
                <th className="text-left py-2 px-3">Room</th>
              </tr>
            </thead>
            <tbody>
              {todayTimetable.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-slate-500">
                    No classes scheduled for today
                  </td>
                </tr>
              ) : (
                todayTimetable.map((entry) => {
                  const period = periodMap[entry.period_id];
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">{period?.period_number + 1}</td>
                      <td className="py-2 px-3">{period && `${formatTime(period.start_time)} - ${formatTime(period.end_time)}`}</td>
                      <td className="py-2 px-3">{classMap[entry.class_id]?.name}</td>
                      <td className="py-2 px-3">{subjectMap[entry.subject_id]?.name}</td>
                      <td className="py-2 px-3">{teacherMap[entry.teacher_id]?.name}</td>
                      <td className="py-2 px-3">{entry.room}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Absences */}
      {todayAbsences.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Today's Absences</h3>
          <div className="space-y-3">
            {todayAbsences.map((absence: TeacherAbsence) => (
              <div key={absence.id} className="flex items-start justify-between p-3 bg-red-50 rounded-md border border-red-200">
                <div>
                  <p className="font-medium">{teacherMap[absence.teacher_id]?.name}</p>
                  <p className="text-sm text-slate-600">{absence.reason}</p>
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(absence.status)}`}>
                  {absence.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Substitutions */}
      {todaySubstitutions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Today's Substitutions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3">Period</th>
                  <th className="text-left py-2 px-3">Class</th>
                  <th className="text-left py-2 px-3">Subject</th>
                  <th className="text-left py-2 px-3">Original Teacher</th>
                  <th className="text-left py-2 px-3">Substitute</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {todaySubstitutions.map((sub: Substitution) => {
                  const period = periodMap[sub.period_id];
                  return (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">{period?.period_number + 1}</td>
                      <td className="py-2 px-3">{classMap[sub.class_id]?.name}</td>
                      <td className="py-2 px-3">{subjectMap[sub.subject_id]?.name}</td>
                      <td className="py-2 px-3">{teacherMap[sub.original_teacher_id]?.name}</td>
                      <td className="py-2 px-3">
                        {sub.substitute_teacher_id ? teacherMap[sub.substitute_teacher_id]?.name : "-"}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(sub.status)}`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
