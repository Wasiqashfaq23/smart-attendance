import { cache } from "react";
import { prisma } from "@/lib/db";

export const getSetting = cache(() => prisma.setting.findFirst());

export const getActiveClasses = cache(() =>
  prisma.classRoom.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  })
);

export const getActiveTeachers = cache(() =>
  prisma.teacher.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  })
);

export const getActiveSubjects = cache(() =>
  prisma.subject.findMany({ orderBy: { name: "asc" } })
);

export const getActivePeriods = cache(() =>
  prisma.period.findMany({
    where: { is_active: true },
    orderBy: [{ applicable_day_type: "asc" }, { period_number: "asc" }],
  })
);