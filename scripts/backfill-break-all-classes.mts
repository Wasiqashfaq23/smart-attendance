import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { DayOfWeek } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const breakSubject = await prisma.subject.findFirst({
    where: { OR: [{ name: "Break" }, { short_name: "Break" }] },
  });
  if (!breakSubject) {
    console.log("No Break subject found; nothing to do.");
    return;
  }

  const p4MonThu = await prisma.period.findUnique({
    where: {
      period_number_applicable_day_type: { period_number: 4, applicable_day_type: "mon_thu" },
    },
  });
  const p4Friday = await prisma.period.findUnique({
    where: {
      period_number_applicable_day_type: { period_number: 4, applicable_day_type: "friday" },
    },
  });
  if (!p4MonThu || !p4Friday) {
    console.log("Period 4 not found; nothing to do.");
    return;
  }

  const classes = await prisma.classRoom.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });

  const days: Array<{ day: DayOfWeek; period_id: number }> = [];
  for (const day of ["monday", "tuesday", "wednesday", "thursday"] as DayOfWeek[]) {
    days.push({ day, period_id: p4MonThu.id });
  }
  days.push({ day: "friday", period_id: p4Friday.id });

  let created = 0;
  for (const c of classes) {
    const existing = new Set(
      (
        await prisma.timetable.findMany({
          where: { class_id: c.id, period_id: { in: [p4MonThu.id, p4Friday.id] } },
          select: { day: true },
        })
      ).map((e) => e.day)
    );
    for (const d of days) {
      if (existing.has(d.day)) continue;
      await prisma.timetable.create({
        data: {
          day: d.day as "monday",
          period_id: d.period_id,
          class_id: c.id,
          subject_id: breakSubject.id,
          teacher_id: null,
          notes: "Break",
        },
      });
      created++;
    }
  }

  console.log(`Backfilled ${created} Break entries across ${classes.length} classes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());