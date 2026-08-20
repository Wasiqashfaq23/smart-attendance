import { prisma } from "@/lib/db";
import { PeriodManager } from "@/components/managers/PeriodManager";

export const dynamic = "force-dynamic";

export default async function PeriodsPage() {
  const periods = await prisma.period.findMany({
    orderBy: [{ applicable_day_type: "asc" }, { period_number: "asc" }],
  });
  return <PeriodManager periods={periods} />;
}