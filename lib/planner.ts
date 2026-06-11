import type { Pillar, Platform } from "./types";

// ── Weekly template ───────────────────────────────────────────────────────────
// Six posting days covering all 7 pillars: Friday rotates between
// social_education and code_x_ai by ISO-week parity, so over two weeks every
// pillar gets its slot. Sunday stays free (that's planning day).
export type TemplateDay = {
  dayOffset: number; // 0 = Monday
  dayName: string;
  platform: Platform;
  pillar: Pillar;
  hour: number; // local EAT hour to post
};

export function weekTemplate(weekStartISO: string): TemplateDay[] {
  const rotate = isoWeekNumber(new Date(weekStartISO)) % 2 === 0;
  return [
    { dayOffset: 0, dayName: "Monday", platform: "linkedin", pillar: "code_craft", hour: 9 },
    { dayOffset: 1, dayName: "Tuesday", platform: "x", pillar: "ai_practice", hour: 10 },
    { dayOffset: 2, dayName: "Wednesday", platform: "youtube_short", pillar: "dev_education", hour: 17 },
    { dayOffset: 3, dayName: "Thursday", platform: "carousel", pillar: "build_in_public", hour: 12 },
    {
      dayOffset: 4,
      dayName: "Friday",
      platform: "linkedin",
      pillar: rotate ? "code_x_ai" : "social_education",
      hour: 9,
    },
    { dayOffset: 5, dayName: "Saturday", platform: "blog", pillar: "simulations", hour: 11 },
  ];
}

// ── How-to-post tips (stored on the slot + shown in reminder emails) ──────────
export function postingTip(platform: Platform): string {
  switch (platform) {
    case "linkedin":
      return "Post 9–11am. Hook line first, blank line after it. Links go in the FIRST COMMENT, not the body. Reply to every comment in the first hour.";
    case "x":
      return "Thread: tweet 1 is the hook — no links in it. Post mid-morning. Pin it for the day and reply to quote-tweets fast.";
    case "youtube_short":
      return "Upload late afternoon. First 3 seconds decide everything — start mid-action. Title under 40 chars, 3 hashtags max.";
    case "video_script":
      return "Record in one take if you can; energy beats polish. Thumbnail: big text, your face, one accent color.";
    case "blog":
      return "Publish, then share the TL;DR as an X thread and the biggest takeaway on LinkedIn 2 days later (re-hooked, not copied).";
    case "carousel":
      return "Post at lunch or evening. Cover slide = pure hook. Ask a question in the caption; first comment = your follow CTA.";
  }
}

// ── Week date helpers ─────────────────────────────────────────────────────────
/** ISO date (yyyy-mm-dd) of the NEXT Monday (or today if it's Monday and early). */
export function nextMondayISO(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const delta = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** This week's Monday (for planning the current week). */
export function thisMondayISO(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** scheduledAt ISO for a template day in a given week (hour in EAT, UTC+3). */
export function slotTimeISO(weekStartISO: string, dayOffset: number, hourEAT: number): string {
  const d = new Date(`${weekStartISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hourEAT - 3, 0, 0, 0); // EAT = UTC+3
  return d.toISOString();
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Planner row exchanged between server actions and the UI ──────────────────
export interface WeekRow {
  dayOffset: number;
  dayName: string;
  platform: Platform;
  pillar: Pillar;
  hour: number;
  enabled: boolean;
  source: "vault" | "ai";
  ideaId?: string; // set when source = vault
  title: string;
  angle?: string;
}
