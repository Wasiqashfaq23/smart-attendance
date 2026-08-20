import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";

export function TopBar({
  name,
  role,
}: {
  name?: string | null;
  role?: string;
}) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white no-print">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ExternalLink size={15} />
          Public view
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800 leading-tight">
            {name ?? "User"}
          </p>
          <p className="text-xs capitalize text-slate-500 leading-tight">
            {role ?? ""}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
          {(name ?? "U").charAt(0).toUpperCase()}
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}