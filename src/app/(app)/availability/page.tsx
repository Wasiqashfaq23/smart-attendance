import { prisma } from "@/lib/db";
import { AvailabilityManager } from "@/components/managers/AvailabilityManager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const [rows, teachers, periods] = await Promise.all([
    prisma.teacherAvailability.findMany({
      include: { teacher: true, period: true },
      orderBy: [{ day: "asc" }, { period_id: "asc" }],
    }),
    prisma.teacher.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
    prisma.period.findMany({
      where: { is_active: true },
      orderBy: [{ applicable_day_type: "asc" }, { period_number: "asc" }],
    }),
  ]);
  return <AvailabilityManager rows={rows} teachers={teachers} periods={periods} />;
}