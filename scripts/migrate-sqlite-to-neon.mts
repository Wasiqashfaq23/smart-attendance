/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const DB_PATH = process.env.SQLITE_DB_PATH ?? "scripts/data/smart_timetable.db";

const sqlite = new Database(DB_PATH, { readonly: true });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
}

function parseTimestamp(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) throw new Error(`Invalid timestamp: ${s}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`);
}

function parseTime(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2}):(\d{2}):(\d{2})/);
  if (!m) throw new Error(`Invalid time: ${s}`);
  return new Date(`1970-01-01T${m[1]}:${m[2]}:${m[3]}.000Z`);
}

function toBool(v: unknown): boolean {
  return !!v && v !== 0 && v !== "0" && v !== "false";
}

function all(table: string): any[] {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function count(table: string): number {
  return (sqlite.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get() as any).c;
}

async function main() {
  console.log(`Reading from ${DB_PATH}`);

  const timestamps = (s: string | null) => {
    const t = parseTimestamp(s) ?? new Date();
    return t;
  };

  const users = all("users").map((r) => ({
    id: r.id as number,
    name: r.name as string,
    username: r.username as string,
    password_hash: (r.password_hash ?? "") as string,
    role: (r.role as "admin" | "scheduler"),
    is_active: toBool(r.is_active),
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const teachers = all("teachers").map((r) => ({
    id: r.id as number,
    name: r.name as string,
    employee_code: r.employee_code as string,
    email: r.email as string | null,
    phone: r.phone as string | null,
    designation: r.designation as string | null,
    department: r.department as string | null,
    status: r.status as "active" | "inactive",
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const classes = all("classes").map((r) => ({
    id: r.id as number,
    name: r.name as string,
    section: r.section as string | null,
    program: r.program as string | null,
    class_code: r.class_code as string,
    status: r.status as "active" | "inactive",
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const subjects = all("subjects").map((r) => ({
    id: r.id as number,
    name: r.name as string,
    short_name: r.short_name as string | null,
    department: r.department as string | null,
    status: r.status as "active" | "inactive",
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const periods = all("periods").map((r) => ({
    id: r.id as number,
    period_number: r.period_number as number,
    start_time: parseTime(r.start_time)!,
    end_time: parseTime(r.end_time)!,
    applicable_day_type: r.applicable_day_type as "mon_thu" | "friday",
    is_active: toBool(r.is_active),
  }));

  const timetable = all("timetable").map((r) => ({
    id: r.id as number,
    day: r.day as
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday",
    period_id: r.period_id as number,
    class_id: r.class_id as number,
    subject_id: r.subject_id as number,
    teacher_id: r.teacher_id as number | null,
    room: r.room as string | null,
    notes: r.notes as string | null,
    is_active: toBool(r.is_active),
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const absences = all("teacher_absences").map((r) => ({
    id: r.id as number,
    teacher_id: r.teacher_id as number,
    date: parseDate(r.date)!,
    reason: r.reason as string | null,
    status: r.status as "absent" | "cancelled",
    notes: r.notes as string | null,
    created_at: timestamps(r.created_at),
  }));

  const availability = all("teacher_availability").map((r) => ({
    id: r.id as number,
    teacher_id: r.teacher_id as number,
    day: r.day as
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday",
    period_id: r.period_id as number,
    is_available: toBool(r.is_available),
    notes: r.notes as string | null,
  }));

  const substitutions = all("substitutions").map((r) => ({
    id: r.id as number,
    absence_id: r.absence_id as number,
    timetable_id: r.timetable_id as number,
    original_teacher_id: r.original_teacher_id as number,
    substitute_teacher_id: r.substitute_teacher_id as number | null,
    date: parseDate(r.date)!,
    period_id: r.period_id as number,
    class_id: r.class_id as number,
    subject_id: r.subject_id as number,
    status: r.status as "pending" | "assigned" | "cancelled",
    notes: r.notes as string | null,
    created_at: timestamps(r.created_at),
    updated_at: timestamps(r.updated_at),
  }));

  const auditLogs = all("audit_logs").map((r) => ({
    id: r.id as number,
    user: r.user as string,
    action: r.action as string,
    entity: r.entity as string,
    entity_id: r.entity_id as string,
    description: r.description as string | null,
    timestamp: timestamps(r.timestamp),
  }));

  const settingsRows = all("settings").map((r) => ({
    id: r.id as number,
    school_name: r.school_name as string,
    school_logo: r.school_logo as string | null,
    academic_session: r.academic_session as string | null,
    working_days: r.working_days as string,
    default_dashboard_view: r.default_dashboard_view as string,
  }));

  const hasAll = (arr: any[], ids: Set<number>, label: string) => {
    for (const x of arr) {
      if (!ids.has(x)) throw new Error(`${label} references missing id ${x}`);
    }
  };

  const teacherIds = new Set(teachers.map((t) => t.id));
  const classIds = new Set(classes.map((c) => c.id));
  const subjectIds = new Set(subjects.map((s) => s.id));
  const periodIds = new Set(periods.map((p) => p.id));
  const timetableIds = new Set(timetable.map((t) => t.id));
  const absenceIds = new Set(absences.map((a) => a.id));

  hasAll(
    timetable.map((t) => t.period_id),
    periodIds,
    "timetable.period_id"
  );
  hasAll(
    timetable.map((t) => t.class_id),
    classIds,
    "timetable.class_id"
  );
  hasAll(
    timetable.map((t) => t.subject_id),
    subjectIds,
    "timetable.subject_id"
  );
  hasAll(
    timetable.map((t) => t.teacher_id).filter(Boolean),
    teacherIds,
    "timetable.teacher_id"
  );
  hasAll(absences.map((a) => a.teacher_id), teacherIds, "absence.teacher_id");
  hasAll(
    availability.map((a) => a.teacher_id),
    teacherIds,
    "availability.teacher_id"
  );
  hasAll(
    availability.map((a) => a.period_id),
    periodIds,
    "availability.period_id"
  );
  hasAll(
    substitutions.map((s) => s.absence_id),
    absenceIds,
    "substitution.absence_id"
  );
  hasAll(
    substitutions.map((s) => s.timetable_id),
    timetableIds,
    "substitution.timetable_id"
  );
  hasAll(
    substitutions.map((s) => s.original_teacher_id),
    teacherIds,
    "substitution.original_teacher_id"
  );
  hasAll(
    substitutions.map((s) => s.substitute_teacher_id).filter(Boolean),
    teacherIds,
    "substitution.substitute_teacher_id"
  );
  hasAll(
    substitutions.map((s) => s.period_id),
    periodIds,
    "substitution.period_id"
  );
  hasAll(
    substitutions.map((s) => s.class_id),
    classIds,
    "substitution.class_id"
  );
  hasAll(
    substitutions.map((s) => s.subject_id),
    subjectIds,
    "substitution.subject_id"
  );

  const findDupes = (key: (x: any) => string | null, rows: any[], label: string) => {
    const seen = new Set<string>();
    for (const r of rows) {
      const k = key(r);
      if (k === null) continue;
      if (seen.has(k)) throw new Error(`Duplicate ${label} key: ${k}`);
      seen.add(k);
    }
  };

  findDupes(
    (t) => `${t.day}|${t.period_id}|${t.class_id}`,
    timetable,
    "timetable"
  );
  findDupes(
    (a) => `${a.teacher_id}|${a.day}|${a.period_id}`,
    availability,
    "availability"
  );
  findDupes(
    (s) =>
      s.substitute_teacher_id === null
        ? null
        : `${s.date.toISOString()}|${s.period_id}|${s.substitute_teacher_id}`,
    substitutions.filter((s) => s.substitute_teacher_id !== null),
    "substitution"
  );

  console.log(
    `Integrity OK. users=${users.length} teachers=${teachers.length} classes=${classes.length} subjects=${subjects.length} periods=${periods.length} timetable=${timetable.length} absences=${absences.length} availability=${availability.length} substitutions=${substitutions.length} auditLogs=${auditLogs.length} settings=${settingsRows.length}`
  );

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.substitution.deleteMany(),
    prisma.teacherAvailability.deleteMany(),
    prisma.teacherAbsence.deleteMany(),
    prisma.timetable.deleteMany(),
    prisma.period.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.classRoom.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({ data: users });
  await prisma.teacher.createMany({ data: teachers });
  await prisma.classRoom.createMany({ data: classes });
  await prisma.subject.createMany({ data: subjects });
  await prisma.period.createMany({ data: periods });
  await prisma.timetable.createMany({ data: timetable });
  await prisma.setting.createMany({ data: settingsRows });
  await prisma.teacherAbsence.createMany({ data: absences });
  await prisma.teacherAvailability.createMany({ data: availability });
  await prisma.substitution.createMany({ data: substitutions });
  await prisma.auditLog.createMany({ data: auditLogs });

  const check = (name: string, expected: number) => {
    const actual = count(name);
    const status = actual === expected ? "OK" : "MISMATCH";
    console.log(`${status}: ${name} = ${actual} (expected ${expected})`);
    if (actual !== expected) throw new Error(`${name} count mismatch`);
  };

  check("users", users.length);
  check("teachers", teachers.length);
  check("classes", classes.length);
  check("subjects", subjects.length);
  check("periods", periods.length);
  check("timetable", timetable.length);
  check("teacher_absences", absences.length);
  check("teacher_availability", availability.length);
  check("substitutions", substitutions.length);
  check("audit_logs", auditLogs.length);
  check("settings", settingsRows.length);

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());