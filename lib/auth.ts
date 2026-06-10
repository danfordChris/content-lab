import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminConfigured } from "./firebase/admin";

export const SESSION_COOKIE = "__session";

export type CurrentUser = { uid: string; email?: string };

/**
 * Resolve the signed-in user.
 * - Firebase mode: verify the session cookie via the Admin SDK.
 * - Local mode (no Firebase configured): a single implicit user, no login needed.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!adminConfigured) return { uid: "local", email: "local@dev" };
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return { uid: decoded.uid, email: decoded.email ?? undefined };
  } catch {
    return null;
  }
}

export async function requireUid(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user.uid;
}
