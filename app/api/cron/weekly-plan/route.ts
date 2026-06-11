import { NextResponse } from "next/server";
import { allUserData, withDrafts, eatWeekWindow, cronAuthorized } from "@/lib/reminders";
import { weeklyPlanEmail, sendMail } from "@/lib/email";
import { nextMondayISO } from "@/lib/planner";

export const dynamic = "force-dynamic";

/** Runs Saturday early morning (~6:00 EAT): email the upcoming week's plan
 *  (or a nudge to plan it) so the user can prepare posts in advance. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const weekStart = nextMondayISO();
  const { start, end } = eatWeekWindow(weekStart);
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { email, db } of await allUserData()) {
    try {
      if (!email) {
        skipped++;
        continue;
      }
      const weekSlots = db.calendar.filter((s) => {
        const t = new Date(s.scheduledAt).getTime();
        return t >= start && t < end;
      });
      const { subject, html } = weeklyPlanEmail(withDrafts(db, weekSlots), weekStart);
      if (await sendMail(email, subject, html)) sent++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message.slice(0, 120) : "send failed");
    }
  }
  return NextResponse.json({ ok: true, weekStart, sent, skipped, errors });
}
