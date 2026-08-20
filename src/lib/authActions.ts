"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirect: false });
  const store = await cookies();
  const names = store.getAll().map((c) => c.name);
  for (const name of names) {
    if (/authjs|next-auth|session|callback|csrf/i.test(name)) {
      store.delete(name);
    }
  }
  redirect("/");
}