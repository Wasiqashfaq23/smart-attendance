import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/queries";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const settings = await getSetting();

  return (
    <div className="flex min-h-screen">
      <Sidebar logo={settings?.school_logo} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar name={session.user.name} role={session.user.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}