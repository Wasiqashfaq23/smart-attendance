import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
            ST
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to manage schedules and substitutions
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}