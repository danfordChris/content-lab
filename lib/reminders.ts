import "server-only";
import { adminAuth, adminConfigured, adminDb } from "./firebase/admin";
import { readDB } from "./store";
import type { CalendarSlot, DB } from "./types";
import type { SlotWithDraft } from "./email";

/** Every user's dataset + the email to notify (settings override → login email). */
export async function allUserData(): Promise<{ email: string | null; db: DB }[]> {
  if (!adminConfigured) {
    // Local mode: single implicit user; send to the configured Gmail account.
    const db = await readDB();
    return [{ email: process.env.GMAIL_USER ?? null, db }];
  }
  const snap = await adminDb().collection("contentlab").get();
  const out: { email: string | null; db: DB }[] = [];
  for (const doc of snap.docs) {
    const db = doc.data() as DB;
    let email: string | null = db.settings?.notifyEmail?.trim() || null;
    if (!email) {
      try {
        email = (await adminAuth().getUser(doc.id)).email ?? null;
      } catch {
        email = null;
      }
    }
    out.push({ email, db });
  }
  return out;
}

export function withDrafts(db: DB, slots: CalendarSlot[]): SlotWithDraft[] {
  return slots.map((s) => ({ ...s, draft: db.drafts.find((d) => d.id === s.draftId) }));
}

/** Today's [start, end) in UTC ms, where "today" is the calendar day in EAT (UTC+3). */
export function eatDayWindow(now = new Date()): { start: number; end: number } {
  const eat = new Date(now.getTime() + 3 * 3600_000);
  const start = Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate()) - 3 * 3600_000;
  return { start, end: start + 24 * 3600_000 };
}

/** [start, end) in UTC ms for the week beginning Monday 00:00 EAT of weekStartISO. */
export function eatWeekWindow(weekStartISO: string): { start: number; end: number } {
  const start = Date.parse(`${weekStartISO}T00:00:00Z`) - 3 * 3600_000;
  return { start, end: start + 7 * 24 * 3600_000 };
}

export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
