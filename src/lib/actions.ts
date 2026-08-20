/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireUser, requireAdmin, AuthError } from "@/lib/guards";
import {
  teacherSchema,
  classSchema,
  subjectSchema,
  periodSchema,
  timetableSchema,
  absenceSchema,
  availabilitySchema,
  substitutionAssignSchema,
  settingsSchema,
  userSchema,
  parseTimeToDate,
} from "@/lib/validation";
import { checkTimetableEntry } from "@/lib/services/conflict";
import {
  assignSubstitute,
  cancelSubstitution,
} from "@/lib/services/substitution";
import { recommendSubstitutes } from "@/lib/services/recommendation";
import {
  markTeacherAbsent,
  cancelAbsence,
  reactivateAbsence,
} from "@/lib/services/absence";

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function withUser(
  action: (user: Awaited<ReturnType<typeof requireUser>>, data: FormData) => Promise<ActionState>
): (prev: ActionState, data: FormData) => Promise<ActionState> {
  return async (_prev: ActionState, data: FormData): Promise<ActionState> => {
    let user;
    try {
      user = await requireUser();
    } catch (e) {
      if (e instanceof AuthError) redirect("/login");
      throw e;
    }
    try {
      return await action(user, data);
    } catch (e: any) {
      console.error("Server action error:", e);
      if (e instanceof AuthError) redirect("/login");
      return { ok: false, message: e?.message ?? "An unexpected error occurred" };
    }
  };
}

function text(data: FormData, key: string): string {
  const v = data.get(key);
  return typeof v === "string" ? v : "";
}

function nullableText(data: FormData, key: string): string | null {
  const v = text(data, key).trim();
  return v === "" ? null : v;
}

function parseFormDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

const postFailure = (e: any): ActionState => {
  if (e?.code === "P2002") return { ok: false, message: "A record with that unique value already exists" };
  if (e?.code === "P2025") return { ok: false, message: "Related record no longer exists" };
  if (e?.code === "P2003") return { ok: false, message: "Cannot perform that action: related records exist" };
  return { ok: false, message: e?.message ?? "An unexpected error occurred" };
};

export const createTeacher = withUser(async (user, data) => {
  const parsed = teacherSchema.safeParse({
    name: text(data, "name"),
    employee_code: text(data, "employee_code"),
    email: nullableText(data, "email") ?? "",
    phone: nullableText(data, "phone"),
    designation: nullableText(data, "designation"),
    department: nullableText(data, "department"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const teacher = await prisma.teacher.create({ data: parsed.data as any });
  await logAudit(user.username ?? user.name ?? "user", "Created", "Teacher", teacher.id);
  revalidatePath("/teachers");
  return { ok: true, message: "Teacher created" };
});

export const updateTeacher = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = teacherSchema.safeParse({
    name: text(data, "name"),
    employee_code: text(data, "employee_code"),
    email: nullableText(data, "email") ?? "",
    phone: nullableText(data, "phone"),
    designation: nullableText(data, "designation"),
    department: nullableText(data, "department"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.teacher.update({ where: { id }, data: parsed.data as any });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "Teacher", id);
  revalidatePath("/teachers");
  return { ok: true, message: "Teacher updated" };
});

export const deleteTeacher = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.teacher.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "Teacher", id);
  revalidatePath("/teachers");
  return { ok: true, message: "Teacher deleted" };
});

export const createClass = withUser(async (user, data) => {
  const parsed = classSchema.safeParse({
    name: text(data, "name"),
    section: nullableText(data, "section"),
    program: nullableText(data, "program"),
    class_code: text(data, "class_code"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const rec = await prisma.classRoom.create({ data: parsed.data as any });
  await logAudit(user.username ?? "user", "Created", "ClassRoom", rec.id);
  revalidatePath("/classes");
  return { ok: true, message: "Class created" };
});

export const updateClass = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = classSchema.safeParse({
    name: text(data, "name"),
    section: nullableText(data, "section"),
    program: nullableText(data, "program"),
    class_code: text(data, "class_code"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.classRoom.update({ where: { id }, data: parsed.data as any });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "ClassRoom", id);
  revalidatePath("/classes");
  return { ok: true, message: "Class updated" };
});

export const deleteClass = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.classRoom.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "ClassRoom", id);
  revalidatePath("/classes");
  return { ok: true, message: "Class deleted" };
});

export const createSubject = withUser(async (user, data) => {
  const parsed = subjectSchema.safeParse({
    name: text(data, "name"),
    short_name: nullableText(data, "short_name"),
    department: nullableText(data, "department"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const rec = await prisma.subject.create({ data: parsed.data as any });
  await logAudit(user.username ?? "user", "Created", "Subject", rec.id);
  revalidatePath("/subjects");
  return { ok: true, message: "Subject created" };
});

export const updateSubject = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = subjectSchema.safeParse({
    name: text(data, "name"),
    short_name: nullableText(data, "short_name"),
    department: nullableText(data, "department"),
    status: text(data, "status") || "active",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.subject.update({ where: { id }, data: parsed.data as any });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "Subject", id);
  revalidatePath("/subjects");
  return { ok: true, message: "Subject updated" };
});

export const deleteSubject = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.subject.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "Subject", id);
  revalidatePath("/subjects");
  return { ok: true, message: "Subject deleted" };
});

export const createPeriod = withUser(async (user, data) => {
  const parsed = periodSchema.safeParse({
    period_number: text(data, "period_number"),
    start_time: text(data, "start_time"),
    end_time: text(data, "end_time"),
    applicable_day_type: text(data, "applicable_day_type"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const { start_time, end_time, ...rest } = parsed.data;
  try {
    const rec = await prisma.period.create({
      data: {
        ...rest,
        start_time: parseTimeToDate(start_time),
        end_time: parseTimeToDate(end_time),
      } as any,
    });
    await logAudit(user.username ?? "user", "Created", "Period", rec.id);
  } catch (e) {
    return postFailure(e);
  }
  revalidatePath("/periods");
  return { ok: true, message: "Period created" };
});

export const updatePeriod = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = periodSchema.safeParse({
    period_number: text(data, "period_number"),
    start_time: text(data, "start_time"),
    end_time: text(data, "end_time"),
    applicable_day_type: text(data, "applicable_day_type"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const { start_time, end_time, ...rest } = parsed.data;
  try {
    await prisma.period.update({
      where: { id },
      data: {
        ...rest,
        start_time: parseTimeToDate(start_time),
        end_time: parseTimeToDate(end_time),
      } as any,
    });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "Period", id);
  revalidatePath("/periods");
  return { ok: true, message: "Period updated" };
});

export const deletePeriod = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.period.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "Period", id);
  revalidatePath("/periods");
  return { ok: true, message: "Period deleted" };
});

export const createTimetable = withUser(async (user, data) => {
  const parsed = timetableSchema.safeParse({
    day: text(data, "day"),
    period_id: text(data, "period_id"),
    class_id: text(data, "class_id"),
    subject_id: text(data, "subject_id"),
    teacher_id: text(data, "teacher_id") || null,
    room: nullableText(data, "room"),
    notes: nullableText(data, "notes"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const teacherId = typeof d.teacher_id === "number" ? d.teacher_id : null;
  const conflicts = await checkTimetableEntry({
    day: d.day,
    periodId: d.period_id,
    classId: d.class_id,
    teacherId: teacherId ?? undefined,
  });
  if (conflicts.length > 0) {
    return { ok: false, message: conflicts.map((c) => c.message).join(". ") };
  }
  try {
    const rec = await prisma.timetable.create({ data: d as any });
    await logAudit(user.username ?? "user", "Created", "Timetable", rec.id);
  } catch (e) {
    return postFailure(e);
  }
  revalidatePath("/timetable");
  revalidatePath("/");
  return { ok: true, message: "Timetable entry created" };
});

export const updateTimetable = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = timetableSchema.safeParse({
    day: text(data, "day"),
    period_id: text(data, "period_id"),
    class_id: text(data, "class_id"),
    subject_id: text(data, "subject_id"),
    teacher_id: text(data, "teacher_id") || null,
    room: nullableText(data, "room"),
    notes: nullableText(data, "notes"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const teacherId = typeof d.teacher_id === "number" ? d.teacher_id : null;
  const conflicts = await checkTimetableEntry(
    {
      day: d.day,
      periodId: d.period_id,
      classId: d.class_id,
      teacherId: teacherId ?? undefined,
    },
    id
  );
  if (conflicts.length > 0) {
    return { ok: false, message: conflicts.map((c) => c.message).join(". ") };
  }
  try {
    await prisma.timetable.update({ where: { id }, data: d as any });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "Timetable", id);
  revalidatePath("/timetable");
  revalidatePath("/");
  return { ok: true, message: "Timetable entry updated" };
});

export const deleteTimetable = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.timetable.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "Timetable", id);
  revalidatePath("/timetable");
  revalidatePath("/");
  return { ok: true, message: "Timetable entry deleted" };
});

export const createAbsence = withUser(async (user, data) => {
  const parsed = absenceSchema.safeParse({
    teacher_id: text(data, "teacher_id"),
    date: text(data, "date"),
    reason: nullableText(data, "reason"),
    status: text(data, "status") || "absent",
    notes: nullableText(data, "notes"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const result = await markTeacherAbsent(d.teacher_id, parseFormDate(d.date), d.reason, d.notes);
  await logAudit(
    user.username ?? "user",
    "Marked teacher absent",
    "TeacherAbsence",
    result.absenceId,
    `Teacher ${d.teacher_id} absent on ${d.date}`
  );
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Absence recorded${result.substitutionsCreated ? `, ${result.substitutionsCreated} pending substitution(s) created` : ""}`,
  };
});

export const cancelAbsenceAction = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const cancelled = await cancelAbsence(id);
  await logAudit(user.username ?? "user", "Cancelled absence", "TeacherAbsence", id);
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return { ok: true, message: `Absence cancelled${cancelled ? `, ${cancelled} substitution(s) cancelled` : ""}` };
});

export const reactivateAbsenceAction = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const created = await reactivateAbsence(id);
  await logAudit(user.username ?? "user", "Marked teacher absent", "TeacherAbsence", id);
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return { ok: true, message: `Absence reactivated${created ? `, ${created} substitution(s) created` : ""}` };
});

export const deleteAbsence = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  try {
    await prisma.$transaction([
      prisma.substitution.deleteMany({ where: { absence_id: id } }),
      prisma.teacherAbsence.delete({ where: { id } }),
    ]);
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "TeacherAbsence", id);
  revalidatePath("/absences");
  revalidatePath("/dashboard");
  return { ok: true, message: "Absence deleted" };
});

export const assignSubstitutionAction = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const parsed = substitutionAssignSchema.safeParse({
    substitute_teacher_id: text(data, "substitute_teacher_id"),
    notes: nullableText(data, "notes"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const result = await assignSubstitute(id, parsed.data.substitute_teacher_id, parsed.data.notes);
  if (!result.ok) return { ok: false, message: result.message };
  await logAudit(
    user.username ?? "user",
    "Assigned substitute",
    "Substitution",
    id,
    `Substitute teacher ${parsed.data.substitute_teacher_id} assigned`
  );
  revalidatePath("/substitutions");
  revalidatePath("/dashboard");
  return { ok: true, message: "Substitute assigned" };
});

export const cancelSubstitutionAction = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  const result = await cancelSubstitution(id, nullableText(data, "notes"));
  if (!result.ok) return { ok: false, message: result.message };
  await logAudit(user.username ?? "user", "Cancelled substitution", "Substitution", id);
  revalidatePath("/substitutions");
  revalidatePath("/dashboard");
  return { ok: true, message: "Substitution cancelled" };
});

export const getRecommendationsAction = withUser(async (_user, data) => {
  const substitutionId = Number(data.get("id"));
  const sub = await prisma.substitution.findUnique({
    where: { id: substitutionId },
    include: { original_teacher: true },
  });
  if (!sub) return { ok: false, message: "Substitution not found" };
  const recommendations = await recommendSubstitutes(
    sub.original_teacher_id,
    sub.date,
    sub.period_id
  );
  return {
    ok: true,
    recommendations: recommendations.map((r) => ({
      teacher_id: r.teacher_id,
      teacher_name: r.teacher_name,
      department: r.department,
      score: r.score,
      reasons: r.reasons,
    })),
  };
});

export const saveAvailability = withUser(async (user, data) => {
  const parsed = availabilitySchema.safeParse({
    teacher_id: text(data, "teacher_id"),
    day: text(data, "day"),
    period_id: text(data, "period_id"),
    is_available: text(data, "is_available") === "on" || text(data, "is_available") === "true",
    notes: nullableText(data, "notes"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  await prisma.teacherAvailability.upsert({
    where: {
      teacher_id_day_period_id: {
        teacher_id: d.teacher_id,
        day: d.day,
        period_id: d.period_id,
      },
    },
    create: d as any,
    update: d as any,
  });
  await logAudit(user.username ?? "user", "Updated", "TeacherAvailability", `${d.teacher_id}-${d.day}-${d.period_id}`);
  revalidatePath("/availability");
  return { ok: true, message: "Availability saved" };
});

export const deleteAvailability = withUser(async (user, data) => {
  const id = Number(data.get("id"));
  await prisma.teacherAvailability.delete({ where: { id } });
  await logAudit(user.username ?? "user", "Deleted", "TeacherAvailability", id);
  revalidatePath("/availability");
  return { ok: true, message: "Availability removed" };
});

export const updateSettings = withUser(async (user, data) => {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    school_name: text(data, "school_name"),
    school_logo: nullableText(data, "school_logo"),
    academic_session: nullableText(data, "academic_session"),
    working_days: text(data, "working_days"),
    default_dashboard_view: text(data, "default_dashboard_view"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const setting = await prisma.setting.findFirst();
  if (setting) {
    await prisma.setting.update({ where: { id: setting.id }, data: parsed.data as any });
  } else {
    await prisma.setting.create({ data: parsed.data as any });
  }
  await logAudit(user.username ?? "user", "Updated", "Setting", setting?.id ?? 1);
  revalidatePath("/settings");
  return { ok: true, message: "Settings saved" };
});

export const createUser = withUser(async (user, data) => {
  await requireAdmin();
  const parsed = userSchema.safeParse({
    name: text(data, "name"),
    username: text(data, "username"),
    password: text(data, "password") || undefined,
    role: text(data, "role"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  if (!parsed.data.password) return { ok: false, message: "Password is required" };
  try {
    const rec = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        password_hash: await bcrypt.hash(parsed.data.password, 12),
        role: parsed.data.role,
        is_active: parsed.data.is_active,
      },
    });
    await logAudit(user.username ?? "user", "Created", "User", rec.id);
  } catch (e) {
    return postFailure(e);
  }
  revalidatePath("/settings");
  return { ok: true, message: "User created" };
});

export const updateUser = withUser(async (user, data) => {
  await requireAdmin();
  const id = Number(data.get("id"));
  const parsed = userSchema.safeParse({
    name: text(data, "name"),
    username: text(data, "username"),
    password: text(data, "password") || undefined,
    role: text(data, "role"),
    is_active: text(data, "is_active") === "on" || text(data, "is_active") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        role: parsed.data.role,
        is_active: parsed.data.is_active,
        ...(parsed.data.password ? { password_hash: await bcrypt.hash(parsed.data.password, 12) } : {}),
      },
    });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Updated", "User", id);
  revalidatePath("/settings");
  return { ok: true, message: "User updated" };
});

export const deleteUser = withUser(async (user, data) => {
  await requireAdmin();
  const id = Number(data.get("id"));
  if (id === Number(user.id)) return { ok: false, message: "You cannot delete your own account" };
  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    return postFailure(e);
  }
  await logAudit(user.username ?? "user", "Deleted", "User", id);
  revalidatePath("/settings");
  return { ok: true, message: "User deleted" };
});