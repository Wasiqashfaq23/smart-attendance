import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const t = (h: number, m: number) =>
  new Date(
    `1970-01-01T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`
  );

const MON_THU_TIMES: [number, number, number, number, number][] = [
  [0, 8, 0, 8, 20],
  [1, 8, 20, 9, 10],
  [2, 9, 10, 9, 55],
  [3, 9, 55, 10, 40],
  [4, 10, 40, 11, 30],
  [5, 11, 30, 12, 15],
  [6, 12, 15, 13, 0],
  [7, 13, 0, 13, 45],
];

const FRIDAY_TIMES: [number, number, number, number, number][] = [
  [0, 8, 0, 8, 10],
  [1, 8, 10, 8, 45],
  [2, 8, 45, 9, 20],
  [3, 9, 20, 9, 55],
  [4, 9, 55, 10, 25],
  [5, 10, 25, 11, 0],
  [6, 11, 0, 11, 35],
  [7, 11, 35, 12, 10],
];

const TEACHERS = [
  ["Ms. Arshia", "T001"],
  ["Sir Javed", "T002"],
  ["Ms. Maheen", "T003"],
  ["Sir Suhaib", "T004"],
  ["Ms. Rashida", "T005"],
  ["Ms. Tayyaba", "T006"],
  ["Ms. Nousheen", "T007"],
  ["Sir Kashif", "T008"],
  ["Ms. Numaira", "T009"],
  ["Ms. Noor", "T010"],
] as const;

const CLASSES = [
  ["B1", "B", "Engg+Med", "B1", "Ms. Arshia"],
  ["B2", "B", "ICS-MPC", "B2", "Ms. Noor"],
  ["B3", "B", "FA.IT", "B3", "Ms. Maheen"],
  ["A1", "A", "Engg+Med", "A1", "Ms. Tayyaba"],
  ["A2", "A", "ICS-MPC", "A2", "Ms. Nousheen"],
  ["A3", "A", "FA.IT", "A3", "Ms. Rashida"],
  ["IX", "IX", "General", "IX", "Ms. Numaira"],
] as const;

const SUBJECTS = [
  ["Assembly / Dengue Awareness", "Assembly", true],
  ["Physics", "Physics", false],
  ["Chemistry", "Chemistry", false],
  ["Biology", "Biology", false],
  ["Computer", "Computer", false],
  ["Mathematics", "Mathematics", false],
  ["English", "English", false],
  ["Urdu", "Urdu", false],
  ["Sociology", "Sociology", false],
  ["Education", "Education", false],
  ["T.Q / Isl", "T.Q / Isl", false],
  ["Pak Study", "Pak Study", false],
  ["Physics / Stats", "Physics / Stats", false],
  ["Biology / Computer", "Bio / Comp", false],
  ["Urdu / English", "Urdu / Eng", false],
  ["Break", "Break", true],
] as const;

async function main() {
  const settingCount = await prisma.setting.count();
  if (settingCount === 0) {
    await prisma.setting.create({
      data: {
        id: 1,
        school_name: "Smart Timetable School",
        academic_session: "2026-2027",
        working_days: "monday,tuesday,wednesday,thursday,friday,saturday,sunday",
      },
    });
    console.log("Seeded settings");
  }

  const teacherCount = await prisma.teacher.count();
  if (teacherCount === 0) {
    await prisma.teacher.createMany({
      data: TEACHERS.map(([name, code]) => ({ name, employee_code: code })),
    });
    console.log("Seeded teachers");
  }

  const subjectCount = await prisma.subject.count();
  if (subjectCount === 0) {
    for (const [name, short, special] of SUBJECTS) {
      await prisma.subject.create({ data: { name, short_name: short, is_special: special } });
    }
    console.log("Seeded subjects");
  }

  const periodCount = await prisma.period.count();
  if (periodCount === 0) {
    for (const [num, sh, sm, eh, em] of MON_THU_TIMES) {
      await prisma.period.create({
        data: {
          period_number: num,
          name: num === 0 ? "Assembly" : null,
          is_special: num === 0,
          start_time: t(sh, sm),
          end_time: t(eh, em),
          applicable_day_type: "mon_thu",
        },
      });
    }
    for (const [num, sh, sm, eh, em] of FRIDAY_TIMES) {
      await prisma.period.create({
        data: {
          period_number: num,
          name: num === 0 ? "Assembly" : null,
          is_special: num === 0,
          start_time: t(sh, sm),
          end_time: t(eh, em),
          applicable_day_type: "friday",
        },
      });
    }
    for (const num of [8]) {
      await prisma.period.create({
        data: {
          period_number: num,
          start_time: t(13, 0),
          end_time: t(13, 45),
          applicable_day_type: "mon_thu",
          is_active: false,
        },
      });
      await prisma.period.create({
        data: {
          period_number: num,
          start_time: t(12, 0),
          end_time: t(12, 30),
          applicable_day_type: "friday",
          is_active: false,
        },
      });
    }
    console.log("Seeded periods (Mon-Thu + Friday timings)");
  }

  const classCount = await prisma.classRoom.count();
  if (classCount === 0) {
    for (const [name, section, program, code, teacherName] of CLASSES) {
      const teacher = await prisma.teacher.findFirst({ where: { name: teacherName } });
      await prisma.classRoom.create({
        data: {
          name,
          section,
          program,
          class_code: code,
          class_teacher_id: teacher?.id ?? null,
        },
      });
    }
    console.log("Seeded classes with class teachers");
  }

  const breakSubject = await prisma.subject.findFirst({
    where: { OR: [{ name: "Break" }, { short_name: "Break" }] },
  });
  const breakClassCount = await prisma.timetable.count({
    where: { subject_id: breakSubject?.id ?? -1 },
  });
  if (breakSubject && breakClassCount === 0) {
    const days = ["monday", "tuesday", "wednesday", "thursday"] as const;
    const p4monThu = await prisma.period.findUnique({
      where: { period_number_applicable_day_type: { period_number: 4, applicable_day_type: "mon_thu" } },
    });
    const p4fri = await prisma.period.findUnique({
      where: { period_number_applicable_day_type: { period_number: 4, applicable_day_type: "friday" } },
    });
    if (p4monThu && p4fri) {
      for (const [name] of CLASSES) {
        const c = await prisma.classRoom.findFirst({ where: { name } });
        if (!c) continue;
        for (const day of days) {
          await prisma.timetable.create({
            data: { day, period_id: p4monThu.id, class_id: c.id, subject_id: breakSubject.id, teacher_id: null, notes: "Break" },
          });
        }
        await prisma.timetable.create({
          data: { day: "friday", period_id: p4fri.id, class_id: c.id, subject_id: breakSubject.id, teacher_id: null, notes: "Break" },
        });
      }
      console.log("Seeded break blocks (period 4)");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());