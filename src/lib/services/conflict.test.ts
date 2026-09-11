import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    timetable: { findMany: vi.fn(), findFirst: vi.fn() },
    substitution: { findFirst: vi.fn() },
    teacherAvailability: { findUnique: vi.fn() },
    timetableTeacher: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import {
  findTeacherConflicts,
  findClassConflict,
  checkTimetableEntry,
  canAssignSubstitute,
} from "./conflict";

const MONDAY = new Date("2026-09-14T00:00:00Z"); // getUTCDay() === 1 → monday

const resetMocks = () => {
  vi.mocked(prisma.timetable.findMany).mockResolvedValue([] as any);
  vi.mocked(prisma.timetable.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.substitution.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.teacherAvailability.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.timetableTeacher.findMany).mockResolvedValue([] as any);
};

beforeEach(() => {
  resetMocks();
});

describe("findTeacherConflicts", () => {
  it("returns a conflict when the teacher is already scheduled at that period", async () => {
    vi.mocked(prisma.timetable.findMany).mockResolvedValue([
      { id: 99, class: { name: "B1" } },
    ] as any);

    const conflicts = await findTeacherConflicts("monday", 3, 2);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("teacher");
    expect(conflicts[0].message).toContain("B1");
  });

  it("returns the excludeId filter so self is ignored", async () => {
    await findTeacherConflicts("monday", 3, 2, 50);
    expect(vi.mocked(prisma.timetable.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 50 },
          teacher_id: 2,
        }),
      })
    );
  });

  it("returns no conflicts when teacher is free", async () => {
    const conflicts = await findTeacherConflicts("monday", 3, 2);
    expect(conflicts).toEqual([]);
  });
});

describe("findClassConflict", () => {
  it("returns a conflict when the class already has an entry", async () => {
    vi.mocked(prisma.timetable.findFirst).mockResolvedValue({ id: 10 } as any);

    const conflicts = await findClassConflict("monday", 3, 5);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("class");
    expect(conflicts[0].message).toContain("already");
  });

  it("returns no conflict when the class is free", async () => {
    const conflicts = await findClassConflict("monday", 3, 5);
    expect(conflicts).toEqual([]);
  });
});

describe("checkTimetableEntry", () => {
  it("aggregates class and teacher conflicts", async () => {
    vi.mocked(prisma.timetable.findFirst).mockResolvedValue({ id: 10 } as any);
    vi.mocked(prisma.timetable.findMany).mockResolvedValue([
      { id: 11, class: { name: "B2" } },
    ] as any);

    const conflicts = await checkTimetableEntry({
      day: "monday",
      periodId: 3,
      classId: 5,
      teacherIds: [2],
    });

    const types = conflicts.map((c) => c.type);
    expect(types).toContain("class");
    expect(types).toContain("teacher");
  });

  it("detects co-teacher conflicts", async () => {
    vi.mocked(prisma.timetableTeacher.findMany).mockResolvedValue([
      { teacher_id: 2, timetable: { class: { name: "B3" } } },
    ] as any);

    const conflicts = await checkTimetableEntry({
      day: "monday",
      periodId: 3,
      classId: 5,
      teacherIds: [2],
    });

    expect(conflicts.some((c) => c.message.includes("co-teacher"))).toBe(true);
  });

  it("returns no conflicts for a clean entry", async () => {
    const conflicts = await checkTimetableEntry({
      day: "monday",
      periodId: 3,
      classId: 5,
      teacherIds: [2],
    });
    expect(conflicts).toEqual([]);
  });
});

describe("canAssignSubstitute", () => {
  it("rejects assigning the original teacher", async () => {
    const result = await canAssignSubstitute(MONDAY, 3, 1, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("original");
  });

  it("rejects a teacher already teaching at that period", async () => {
    vi.mocked(prisma.timetable.findFirst).mockResolvedValue({ id: 20 } as any);

    const result = await canAssignSubstitute(MONDAY, 3, 2, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already teaching");
  });

  it("rejects a teacher already assigned to a substitution that period", async () => {
    vi.mocked(prisma.substitution.findFirst).mockResolvedValue({ id: 30 } as any);

    const result = await canAssignSubstitute(MONDAY, 3, 2, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already has a substitution");
  });

  it("rejects a teacher marked unavailable at that period", async () => {
    vi.mocked(prisma.teacherAvailability.findUnique).mockResolvedValue({
      is_available: false,
    } as any);

    const result = await canAssignSubstitute(MONDAY, 3, 2, 1);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("unavailable");
  });

  it("accepts an eligible substitute", async () => {
    const result = await canAssignSubstitute(MONDAY, 3, 2, 1);
    expect(result.ok).toBe(true);
  });
});