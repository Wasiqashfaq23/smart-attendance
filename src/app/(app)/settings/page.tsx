import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SettingsManager } from "@/components/managers/SettingsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const currentUserId = session?.user?.id ?? "";

  const [setting, users] = await Promise.all([
    prisma.setting.findFirst(),
    prisma.user.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <SettingsManager
      setting={setting}
      users={users}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
    />
  );
}