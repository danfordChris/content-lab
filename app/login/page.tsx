"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signInGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const cred = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Sign-in failed");
      router.push("/");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="card p-8 w-full max-w-sm flex flex-col gap-5 text-center">
        <div className="mono text-xl font-semibold">&lt;danfordchris/&gt;</div>
        <div>
          <h1 className="text-lg font-medium">Content Lab</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your content engine.</p>
        </div>
        <button onClick={signInGoogle} disabled={busy} className="btn btn-primary w-full">
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        {err && <p className="text-xs text-red-400">{err}</p>}
        <p className="text-[11px] text-zinc-600">
          Enable the Google provider in Firebase → Authentication → Sign-in method.
        </p>
      </div>
    </div>
  );
}
