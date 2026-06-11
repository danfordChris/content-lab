import type { Pillar, Platform } from "./types";

// ── Weekly template ───────────────────────────────────────────────────────────
// A creator week built for short-form reach on the three platforms that matter
// most here — Instagram Reels, LinkedIn, and TikTok — all teaching the AI basics
// most people don't understand: Claude, ChatGPT, free "vibe coding" tools, and
// automating real life with AI. Each day carries a concrete topic seed so the
// AI fills the slot on-theme. Sunday stays free (planning day).
export type TemplateDay = {
  dayOffset: number; // 0 = Monday
  dayName: string;
  platform: Platform;
  pillar: Pillar;
  hour: number; // local EAT hour to post
  topic: string; // AI-basics seed the idea generator riffs on
};

// Two themed rotations so back-to-back weeks never repeat the same angle.
const WEEK_A: Omit<TemplateDay, "dayOffset" | "dayName" | "hour">[] = [
  { platform: "linkedin", pillar: "ai_practice", topic: "What Claude actually is and how it differs from ChatGPT — explained for non-technical people" },
  { platform: "tiktok", pillar: "social_education", topic: "Build a real website by just talking to a free AI tool (vibe coding) — no code at all" },
  { platform: "instagram_reel", pillar: "ai_practice", topic: "ChatGPT vs Claude: which one to use for what, with real everyday examples" },
  { platform: "linkedin", pillar: "code_x_ai", topic: "Automate a boring daily task with ChatGPT in 10 minutes — no coding required" },
  { platform: "tiktok", pillar: "dev_education", topic: "3 free AI tools that build apps and websites for you (bolt.new, v0, Claude artifacts)" },
  { platform: "instagram_reel", pillar: "social_education", topic: "Vibe coding explained: make an app without knowing how to code" },
];

const WEEK_B: Omit<TemplateDay, "dayOffset" | "dayName" | "hour">[] = [
  { platform: "linkedin", pillar: "code_x_ai", topic: "How I use Claude to turn a plain-English idea into a working web app" },
  { platform: "tiktok", pillar: "ai_practice", topic: "Prompts you should be using in ChatGPT but aren't — the AI basics nobody teaches" },
  { platform: "instagram_reel", pillar: "dev_education", topic: "Build and publish a portfolio site with a free AI tool in one sitting" },
  { platform: "linkedin", pillar: "social_education", topic: "AI won't take your job, but here's what it can already do for you today" },
  { platform: "tiktok", pillar: "code_x_ai", topic: "Automate your week with ChatGPT + Claude — emails, planning, and notes on autopilot" },
  { platform: "instagram_reel", pillar: "ai_practice", topic: "5 things people get wrong about how ChatGPT and Claude actually work" },
];

const DAYS: { dayOffset: number; dayName: string; hour: number }[] = [
  { dayOffset: 0, dayName: "Monday", hour: 9 },
  { dayOffset: 1, dayName: "Tuesday", hour: 19 },
  { dayOffset: 2, dayName: "Wednesday", hour: 12 },
  { dayOffset: 3, dayName: "Thursday", hour: 9 },
  { dayOffset: 4, dayName: "Friday", hour: 19 },
  { dayOffset: 5, dayName: "Saturday", hour: 11 },
];

export function weekTemplate(weekStartISO: string): TemplateDay[] {
  const plan = isoWeekNumber(new Date(weekStartISO)) % 2 === 0 ? WEEK_A : WEEK_B;
  return DAYS.map((d, i) => ({ ...d, ...plan[i] }));
}

// ── How-to-post tips (stored on the slot + shown in reminder emails) ──────────
export function postingTip(platform: Platform): string {
  switch (platform) {
    case "linkedin":
      return "Post 9–11am. Hook line first, blank line after it. Links go in the FIRST COMMENT, not the body. Reply to every comment in the first hour.";
    case "instagram_reel":
      return "Post 11am–1pm or 7–9pm. First 2 seconds = the hook (start mid-action). Add big on-screen captions, a trending audio, and a strong cover frame. Put the CTA in the caption + a pinned first comment.";
    case "tiktok":
      return "Post 6–10pm. Hook in the first 2 seconds, talk fast, keep cuts tight. Use a trending sound at low volume, 4–6 niche hashtags, and reply to early comments with a follow-up video.";
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
  topic?: string; // AI-basics seed carried from the template
  enabled: boolean;
  source: "vault" | "ai";
  ideaId?: string; // set when source = vault
  title: string;
  angle?: string;
}
