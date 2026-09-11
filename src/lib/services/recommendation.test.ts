/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    timetable: { findMany: vi.fn(), groupBy: vi.fn() },
    substitution: { findMany: vi.fn(), groupBy: vi.fn() },
    teacher: { findMany: vi.fn(), findUnique: vi.fn() },
    teacherAvailability: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { recommendSubstitutes } from "./recommendation";

const MONDAY = new Date("2026-09-14T00:00:00Z"); // getUTCDay() === 1 → monday

const ORIGINAL = { id: 1, name: "Sir A", department: "Science" };

const TEACHERS = [
  { id: 2, name: "Ms B", department: "Science", status: "active" as const },
  { id: 3, name: "Mr C", department: "Maths", status: "active" as const },
  { id: 4, name: "Ms D", department: "Maths", status: "active" as const },
  { id: 5, name: "Mr E", department: null, status: "active" as const },
  { id: 6, name: "Ms F", department: null, status: "active" as const },
];

const resetMocks = () => {
  vi.mocked(prisma.timetable.findMany).mockResolvedValue([]);
  vi.mocked(prisma.substitution.findMany).mockResolvedValue([]);
  vi.mocked(prisma.teacher.findMany).mockResolvedValue(TEACHERS as any);
  vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([] as any);
  vi.mocked(prisma.timetable.groupBy).mockResolvedValue([] as any);
  vi.mocked(prisma.substitution.groupBy).mockResolvedValue([] as any);
  vi.mocked(prisma.teacher.findUnique).mockResolvedValue(ORIGINAL as any);
};

beforeEach(() => {
  resetMocks();
});

describe("recommendSubstitutes", () => {
  it("excludes the original teacher, busy teachers, already-assigned teachers, and unavailable teachers", async () => {
    vi.mocked(prisma.timetable.findMany).mockResolvedValue([{ teacher_id: 3 }] as any);
    vi.mocked(prisma.substitution.findMany).mockResolvedValue([
      { substitute_teacher_id: 4 },
    ] as any);
    vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([
      { teacher_id: 5, period_id: 7, is_available: false },
    ] as any);

    const results = await recommendSubstitutes(1, MONDAY, 7);

    const ids = results.map((r) => r.teacher_id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(3);
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
    expect(ids).toContain(2);
    expect(ids).toContain(6);
  });

  it("scores same-department + low-workload + marked-available teacher highest", async () => {
    vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([
      { teacher_id: 2, period_id: 7, is_available: true },
      { teacher_id: 6, period_id: 7, is_available: false },
    ] as any);
    vi.mocked(prisma.timetable.groupBy).mockResolvedValue([
      { teacher_id: 2, _count: { _all: 1 } },
      { teacher_id: 6, _count: { _all: 2 } },
    ] as any);

    const results = await recommendSubstitutes(1, MONDAY, 7);

    const teacher2 = results.find((r) => r.teacher_id === 2);
    const teacher6 = results.find((r) => r.teacher_id === 6);

    expect(teacher2).toBeDefined();
    expect(teacher2?.score).toBeGreaterThan(teacher6?.score ?? Infinity);

    // Teacher 2: 50 base + 15 low workload + 10 marked available + 8 same dept = 83
    expect(teacher2?.score).toBe(83);
    expect(teacher2?.reasons).toContain("Low workload on this day");
    expect(teacher2?.reasons).toContain("Marked available for this period");
    expect(teacher2?.reasons).toContain("Same department");
  });

  it("deducts points for high workload and existing substitutions", async () => {
    vi.mocked(prisma.timetable.groupBy).mockResolvedValue([
      { teacher_id: 2, _count: { _all: 7 } },
      { teacher_id: 6, _count: { _all: 2 } },
    ] as any);
    vi.mocked(prisma.substitution.groupBy).mockResolvedValue([
      { substitute_teacher_id: 6, _count: { _all: 2 } },
    ] as any);

    const results = await recommendSubstitutes(1, MONDAY, 7);

    const teacher2 = results.find((r) => r.teacher_id === 2);
    const teacher6 = results.find((r) => r.teacher_id === 6);

    // Teacher 2: 50 - 10 high workload = 40
    expect(teacher2?.score).toBe(40);
    expect(teacher2?.reasons).toContain("High workload on this day");

    // Teacher 6: 50 + 15 low workload - 10 (2 subs × 5) = 55
    expect(teacher6?.score).toBe(55);
    expect(teacher6?.reasons).toContain("Already covering 2 substitution(s) today");
  });

  it("returns results sorted by score descending", async () => {
    vi.mocked(prisma.teacher.findMany).mockResolvedValue(
      TEACHERS.map((t) => ({ ...t, department: null })) as any
    );
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue({ ...ORIGINAL, department: null } as any);

    const results = await recommendSubstitutes(1, MONDAY, 7);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("respects the limit parameter", async () => {
    const results = await recommendSubstitutes(1, MONDAY, 7, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns an empty array when no eligible teachers exist", async () => {
    vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any);
    const results = await recommendSubstitutes(1, MONDAY, 7);
    expect(results).toEqual([]);
  });
});