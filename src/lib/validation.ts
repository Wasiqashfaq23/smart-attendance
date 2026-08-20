import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export const statusSchema = z.enum(["active", "inactive"]);

export const daySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);

export const periodDayTypeSchema = z.enum(["mon_thu", "friday"]);

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be YYYY-MM-DD",
});

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: "Time must be HH:MM or HH:MM:SS",
  });

export const teacherSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  employee_code: z.string().trim().min(1, "Employee code is required").max(40),
  email: z.union([z.string().email("Invalid email").trim(), z.literal(""), z.null()]).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  designation: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  status: statusSchema.default("active"),
});

export const classSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  section: z.string().trim().max(40).optional().nullable(),
  program: z.string().trim().max(100).optional().nullable(),
  class_code: z.string().trim().min(1, "Class code is required").max(40),
  status: statusSchema.default("active"),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  short_name: z.string().trim().max(30).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  status: statusSchema.default("active"),
});

export const periodSchema = z.object({
  period_number: z.coerce.number().int().min(0, "Must be >= 0"),
  start_time: timeSchema,
  end_time: timeSchema,
  applicable_day_type: periodDayTypeSchema,
  is_active: z.coerce.boolean().default(true),
});

export const timetableSchema = z.object({
  day: daySchema,
  period_id: idSchema,
  class_id: idSchema,
  subject_id: idSchema,
  teacher_id: z.union([idSchema, z.literal(""), z.null()]).optional().nullable(),
  room: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(255).optional().nullable(),
  is_active: z.coerce.boolean().default(true),
});

export const absenceSchema = z.object({
  teacher_id: idSchema,
  date: dateSchema,
  reason: z.string().trim().max(255).optional().nullable(),
  status: z.enum(["absent", "cancelled"]).default("absent"),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const availabilitySchema = z.object({
  teacher_id: idSchema,
  day: daySchema,
  period_id: idSchema,
  is_available: z.coerce.boolean().default(true),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const substitutionAssignSchema = z.object({
  substitute_teacher_id: idSchema,
  notes: z.string().trim().max(255).optional().nullable(),
});

export const settingsSchema = z.object({
  school_name: z.string().trim().min(1, "School name is required").max(255),
  school_logo: z.string().trim().max(255).optional().nullable(),
  academic_session: z.string().trim().max(60).optional().nullable(),
  working_days: z.string().trim().max(120),
  default_dashboard_view: z.string().trim().max(60),
});

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  username: z.string().trim().min(3, "Username must be at least 3 chars").max(60),
  password: z.string().min(6, "Password must be at least 6 chars").optional(),
  role: z.enum(["admin", "scheduler"]),
  is_active: z.coerce.boolean().default(true),
});

export function parseTimeToDate(hhmmss: string): Date {
  const [h, m, s] = hhmmss.split(":").map((x) => Number(x) || 0);
  return new Date(Date.UTC(1970, 0, 1, h, m, s));
}

export function formatTime(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 8);
  return d.toISOString().slice(11, 19);
}

export function formatDate(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}