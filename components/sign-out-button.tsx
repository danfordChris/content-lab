"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/firebase/client";

export function SignOutButton({ email }: { email?: string }) {
  const router = useRouter();
  async function out() {
    try {
      await signOut(getClientAuth());
    } catch {
      /* ignore */
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={out}
      title={email}
      className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 text-left"
    >
      {email ? `${email} · ` : ""}Sign out
    </button>
  );
}
