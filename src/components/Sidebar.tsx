"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  School,
  BookOpen,
  Clock,
  Stethoscope,
  UserCheck,
  Timer,
  FileBarChart,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/classes", label: "Classes", icon: School },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/periods", label: "Periods", icon: Clock },
  { href: "/absences", label: "Absences", icon: Stethoscope },
  { href: "/substitutions", label: "Substitutions", icon: UserCheck },
  { href: "/availability", label: "Availability", icon: Timer },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ logo }: { logo?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-slate-950 text-slate-300 flex flex-col min-h-screen sticky top-0 h-screen">
      <div className="px-5 py-6 flex items-center gap-3">
        {logo ? (
          <img
            src={logo}
            alt="School logo"
            className="w-9 h-9 rounded-xl object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
            ST
          </div>
        )}
        <div>
          <p className="text-white font-semibold text-sm leading-tight">
            Smart Timetable
          </p>
          <p className="text-[11px] text-slate-500">Management Console</p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((l) => {
          const Icon = l.icon;
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}