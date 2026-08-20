import { MasterTimetable, parseMasterDay } from "@/components/MasterTimetable";
import { PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/ReportControls";

export const dynamic = "force-dynamic";

export default async function MasterPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const sp = await searchParams;
  const day = parseMasterDay(sp.day);

  return (
    <div>
      <PageHeader
        title="Master timetable"
        subtitle="All classes at a glance"
        actions={<PrintButton />}
      />
      <MasterTimetable day={day} hrefPrefix="/master" />
    </div>
  );
}