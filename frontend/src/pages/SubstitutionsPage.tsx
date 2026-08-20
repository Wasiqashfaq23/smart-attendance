import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, Loader, CheckCircle } from "lucide-react";
import * as api from "../utils/api";
import { formatDate, formatTime, getStatusColor } from "../utils/helpers";
import { Substitution, RecommendationReason } from "../types";

export default function SubstitutionsPage() {
  const queryClient = useQueryClient();
  const [selectedSubstitutionId, setSelectedSubstitutionId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationReason[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { data: rawSubstitutions = [], isLoading } = useQuery({
    queryKey: ["substitutions"],
    queryFn: () => api.getSubstitutions(),
  });

  const { data: rawTeachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: api.getTeachers,
  });

  const { data: rawClasses = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: api.getClasses,
  });

  const { data: rawSubjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: api.getSubjects,
  });

  const { data: rawPeriods = [] } = useQuery({
    queryKey: ["periods"],
    queryFn: api.getPeriods,
  });

  const substitutions = Array.isArray(rawSubstitutions) ? rawSubstitutions : [];
  const teachers = Array.isArray(rawTeachers) ? rawTeachers : [];
  const classes = Array.isArray(rawClasses) ? rawClasses : [];
  const subjects = Array.isArray(rawSubjects) ? rawSubjects : [];
  const periods = Array.isArray(rawPeriods) ? rawPeriods : [];

  const getRecommendationsMutation = useMutation({
    mutationFn: api.getRecommendations,
    onSuccess: (data) => {
      setRecommendations(data);
      setShowRecommendations(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail?.message || "Failed to get recommendations");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ substitutionId, substituteId }: { substitutionId: number; substituteId: number }) => {
      const sub = substitutions.find((s) => s.id === substitutionId);
      if (!sub) throw new Error("Substitution not found");
      return api.assignSubstitute({
        absence_id: sub.absence_id,
        timetable_id: sub.timetable_id,
        substitute_teacher_id: substituteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Substitute assigned successfully");
      setShowRecommendations(false);
      setSelectedSubstitutionId(null);
      setRecommendations([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail?.message || "Failed to assign substitute");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelSubstitution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Substitution cancelled successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail?.message || "Failed to cancel substitution");
    },
  });

  const handleGetRecommendations = (subId: number) => {
    setSelectedSubstitutionId(subId);
    getRecommendationsMutation.mutate(subId);
  };

  const handleAssign = (substituteId: number) => {
    if (!selectedSubstitutionId) return;
    assignMutation.mutate({ substitutionId: selectedSubstitutionId, substituteId });
  };

  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const periodMap = Object.fromEntries(periods.map((p) => [p.id, p]));

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader className="animate-spin" /></div>;
  }

  const pendingSubstitutions = substitutions.filter((s) => s.status === "pending");
  const assignedSubstitutions = substitutions.filter((s) => s.status === "assigned");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Substitutions</h1>
        <p className="text-slate-600 mt-1">Manage teacher substitutions and recommendations</p>
      </div>

      {/* Pending Substitutions */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Pending Substitutions ({pendingSubstitutions.length})</h3>
        {pendingSubstitutions.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No pending substitutions</p>
        ) : (
          <div className="space-y-3">
            {pendingSubstitutions.map((sub) => {
              const period = periodMap[sub.period_id];
              const selected = selectedSubstitutionId === sub.id;
              return (
                <div key={sub.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-600">Class</p>
                      <p className="font-medium">{classMap[sub.class_id]?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Subject</p>
                      <p className="font-medium">{subjectMap[sub.subject_id]?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Period</p>
                      <p className="font-medium">
                        Period {period?.period_number + 1} ({formatTime(period?.start_time)} - {formatTime(period?.end_time)})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Absent Teacher</p>
                      <p className="font-medium">{teacherMap[sub.original_teacher_id]?.name}</p>
                    </div>
                  </div>

                  {selected && showRecommendations ? (
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-semibold">Recommended Substitutes</h4>
                      {recommendations.length === 0 ? (
                        <p className="text-slate-500 text-sm">No available substitutes</p>
                      ) : (
                        recommendations.map((rec) => (
                          <div key={rec.teacher_id} className="flex items-start justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex-1">
                              <p className="font-medium">{rec.teacher_name}</p>
                              <p className="text-sm text-slate-600">Score: {rec.score}</p>
                              <div className="mt-2 text-xs text-slate-600 space-y-1">
                                {rec.reasons.map((reason, idx) => (
                                  <p key={idx} className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    {reason}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAssign(rec.teacher_id)}
                              disabled={assignMutation.isPending}
                              className="ml-4 btn-primary whitespace-nowrap text-sm"
                            >
                              {assignMutation.isPending ? "Assigning..." : "Assign"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGetRecommendations(sub.id)}
                        disabled={getRecommendationsMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-700 transition"
                      >
                        <Zap size={16} /> Get Recommendations
                      </button>
                      <button
                        onClick={() => cancelMutation.mutate(sub.id)}
                        className="px-4 py-2 border border-slate-300 text-slate-900 rounded-md hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned Substitutions */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Assigned Substitutions ({assignedSubstitutions.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Period</th>
                <th className="text-left py-3 px-4">Class</th>
                <th className="text-left py-3 px-4">Subject</th>
                <th className="text-left py-3 px-4">Original Teacher</th>
                <th className="text-left py-3 px-4">Substitute</th>
              </tr>
            </thead>
            <tbody>
              {assignedSubstitutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-slate-500">
                    No assigned substitutions
                  </td>
                </tr>
              ) : (
                assignedSubstitutions.map((sub) => {
                  const period = periodMap[sub.period_id];
                  return (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">{formatDate(sub.date)}</td>
                      <td className="py-3 px-4">{period?.period_number + 1}</td>
                      <td className="py-3 px-4">{classMap[sub.class_id]?.name}</td>
                      <td className="py-3 px-4">{subjectMap[sub.subject_id]?.name}</td>
                      <td className="py-3 px-4">{teacherMap[sub.original_teacher_id]?.name}</td>
                      <td className="py-3 px-4 font-medium">{sub.substitute_teacher_id ? teacherMap[sub.substitute_teacher_id]?.name : "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
