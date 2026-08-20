"use client";

import { useCallback, useState } from "react";
import { Plus, XCircle, Sparkles } from "lucide-react";
import { Button, Badge, statusTone, PageHeader } from "@/components/ui";
import { FormModal, InlineAction, fieldError } from "@/components/FormModal";
import {
  assignSubstitutionAction,
  cancelSubstitutionAction,
  getRecommendationsAction,
} from "@/lib/actions";
import type { ActionState } from "@/lib/actions";

type Sub = {
  id: number;
  date: Date;
  status: string;
  notes: string | null;
  class: { id: number; name: string };
  subject: { name: string };
  period: { id: number; period_number: number };
  original_teacher: { id: number; name: string };
  substitute_teacher: { id: number; name: string } | null;
};

type Recommendation = {
  teacher_id: number;
  teacher_name: string;
  department: string | null;
  score: number;
  reasons: string[];
};

function StatusCell({ s, onAssign }: { s: Sub; onAssign: (s: Sub) => void }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {s.status === "pending" ? (
        <Button onClick={() => onAssign(s)}>
          <Plus size={15} /> Assign
        </Button>
      ) : null}
      {s.status !== "cancelled" ? (
        <InlineAction
          action={cancelSubstitutionAction}
          id={s.id}
          confirm="Cancel this substitution?"
        >
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg px-2 py-1.5 hover:border-red-200">
            <XCircle size={13} /> Cancel
          </span>
        </InlineAction>
      ) : null}
    </div>
  );
}

function SubTable({
  rows,
  label,
  onAssign,
}: {
  rows: Sub[];
  label: string;
  onAssign: (s: Sub) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{label}</h2>
        <Badge tone="gray">{rows.length}</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">None</p>
      ) : (
        <table className="tbl w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Original</th>
              <th>Substitute</th>
              <th>Status</th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="text-slate-500 whitespace-nowrap">
                  {s.date.toISOString().slice(0, 10)}
                </td>
                <td className="font-medium">{s.class.name}</td>
                <td className="text-slate-500">P{s.period.period_number}</td>
                <td className="text-slate-500">{s.subject.name}</td>
                <td className="text-slate-500">{s.original_teacher.name}</td>
                <td className="font-medium">
                  {s.substitute_teacher?.name ?? (
                    <span className="text-amber-600">Unassigned</span>
                  )}
                </td>
                <td>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </td>
                <td className="no-print">
                  <StatusCell s={s} onAssign={onAssign} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function SubstitutionManager({
  substitutions,
  teachers,
}: {
  substitutions: Sub[];
  teachers: { id: number; name: string; department: string | null }[];
}) {
  const [assigning, setAssigning] = useState<Sub | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  const loadRecommendations = useCallback(async (id: number) => {
    setLoadingRecs(true);
    setRecommendations(null);
    const fd = new FormData();
    fd.set("id", String(id));
    const res = (await getRecommendationsAction({} as ActionState, fd)) as ActionState & {
      recommendations?: Recommendation[];
    };
    setLoadingRecs(false);
    if (res.recommendations) {
      setRecommendations(res.recommendations);
      if (res.recommendations.length > 0) {
        setSelectedTeacher(String(res.recommendations[0].teacher_id));
      }
    }
  }, []);

  function openAssign(sub: Sub) {
    setAssigning(sub);
    setSelectedTeacher("");
    setRecommendations(null);
    loadRecommendations(sub.id);
  }

  const pending = substitutions.filter((s) => s.status === "pending");
  const assigned = substitutions.filter((s) => s.status === "assigned");
  const cancelled = substitutions.filter((s) => s.status === "cancelled");

  return (
    <div>
      <PageHeader
        title="Substitutions"
        subtitle={`${pending.length} pending · ${assigned.length} assigned`}
      />

      <div className="space-y-6">
        <SubTable rows={pending} label="Pending — need coverage" onAssign={openAssign} />
        <SubTable rows={assigned} label="Assigned" onAssign={openAssign} />
        <SubTable rows={cancelled} label="Cancelled" onAssign={openAssign} />
      </div>

      <FormModal
        title="Assign substitute"
        open={!!assigning}
        onClose={() => setAssigning(null)}
        action={assignSubstitutionAction}
      >
        {(state) => (
          <>
            {assigning ? (
              <input type="hidden" name="id" value={assigning.id} />
            ) : null}
            {assigning ? (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600 space-y-0.5 mb-3">
                <p>
                  <span className="font-medium">Class {assigning.class.name}</span> ·{" "}
                  P{assigning.period.period_number} · {assigning.subject.name}
                </p>
                <p>
                  Original: <span className="font-medium">{assigning.original_teacher.name}</span>{" "}
                  on {assigning.date.toISOString().slice(0, 10)}
                </p>
              </div>
            ) : null}

            {loadingRecs ? (
              <p className="text-sm text-slate-500 py-3">Finding available teachers…</p>
            ) : null}

            {!loadingRecs && recommendations && recommendations.length === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 mb-3">
                No recommended teachers available for this slot. Choose manually below.
              </div>
            ) : null}

            {!loadingRecs && recommendations && recommendations.length > 0 ? (
              <div className="mb-3">
                <p className="label flex items-center gap-1">
                  <Sparkles size={13} /> Recommended teachers
                </p>
                <div className="space-y-1.5">
                  {recommendations.map((r) => (
                    <label
                      key={r.teacher_id}
                      className="flex items-start gap-2 rounded-xl border border-slate-200 p-2.5 cursor-pointer hover:border-brand-300"
                    >
                      <input
                        type="radio"
                        name="substitute_teacher_id"
                        value={r.teacher_id}
                        checked={selectedTeacher === String(r.teacher_id)}
                        onChange={() => setSelectedTeacher(String(r.teacher_id))}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {r.teacher_name}
                          {r.department ? (
                            <span className="text-xs text-slate-400 font-normal">
                              {" "}
                              · {r.department}
                            </span>
                          ) : null}
                        </p>
                        {r.reasons.length > 0 ? (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.reasons.join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-400">{r.score}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="label">Or choose any teacher</label>
              <select
                name="substitute_teacher_id"
                className="input"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                required
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.department ? ` (${t.department})` : ""}
                  </option>
                ))}
              </select>
              {fieldError(state, "substitute_teacher_id") ? (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError(state, "substitute_teacher_id")}
                </p>
              ) : null}
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" defaultValue="" placeholder="Optional" />
            </div>
          </>
        )}
      </FormModal>
    </div>
  );
}