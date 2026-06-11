import { NextResponse } from "next/server";
import { allUserData, withDrafts, eatDayWindow, cronAuthorized } from "@/lib/reminders";
import { dailyReminderEmail, sendMail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Runs every morning (~7:00 EAT): email each user the posts scheduled today. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { start, end } = eatDayWindow();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { email, db } of await allUserData()) {
    try {
      const todays = db.calendar.filter((s) => {
        const t = new Date(s.scheduledAt).getTime();
        return s.status === "scheduled" && t >= start && t < end;
      });
      if (!email || todays.length === 0) {
        skipped++;
        continue;
      }
      const { subject, html } = dailyReminderEmail(withDrafts(db, todays));
      if (await sendMail(email, subject, html)) sent++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message.slice(0, 120) : "send failed");
    }
  }
  return NextResponse.json({ ok: true, sent, skipped, errors });
}
