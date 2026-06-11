import "server-only";
import nodemailer from "nodemailer";
import type { CalendarSlot, Draft, Pillar } from "./types";
import { pillarMeta, platformMeta } from "./types";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const APP_URL = (process.env.APP_URL ?? "https://contentlab.danfordchris.dev").replace(/\/+$/, "");

export const emailEnabled = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailEnabled) {
    console.warn("email: GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping send to", to);
    return false;
  }
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  await transport.sendMail({
    from: `"ContentForge" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}

// ── Shared template pieces (dark, brand-styled, inline CSS for email clients) ─
const wordmark = `<span style="font-family:Menlo,Consolas,monospace;font-size:18px;"><span style="color:#8A8A8A">&lt;</span><span style="color:#ffffff">Danford</span><span style="color:#2563EB">Chris</span><span style="color:#8A8A8A">/&gt;</span></span>`;

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0A0A0A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
    <div style="margin-bottom:8px;">${wordmark}</div>
    <div style="height:6px;width:72px;background:#2563EB;border-radius:3px;margin-bottom:24px;"></div>
    <h1 style="font-size:20px;font-weight:600;color:#ffffff;margin:0 0 16px;">${title}</h1>
    ${body}
    <p style="font-size:12px;color:#5a5a62;margin-top:32px;">ContentForge · capture → multiply → recycle<br/>
    <a href="${APP_URL}" style="color:#2563EB;text-decoration:none;">${APP_URL.replace("https://", "")}</a></p>
  </div></body></html>`;
}

function pillarChip(pillar?: Pillar): string {
  if (!pillar) return "";
  const m = pillarMeta(pillar);
  return m
    ? `<span style="font-size:11px;border:1px solid ${m.color}55;color:${m.color};border-radius:999px;padding:2px 9px;margin-left:6px;">${m.label}</span>`
    : "";
}

export type SlotWithDraft = CalendarSlot & { draft?: Draft };

function slotCard(s: SlotWithDraft): string {
  const time = new Date(s.scheduledAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
  const platform = platformMeta(s.platform).label;
  const title = s.draft?.title ?? "(draft missing)";
  const link = s.draft ? `${APP_URL}/drafts/${s.draft.id}` : APP_URL;
  return `<div style="background:#131317;border:1px solid #26262b;border-radius:12px;padding:16px;margin-bottom:12px;">
    <div style="font-size:12px;color:#8a8a90;margin-bottom:6px;">${time} EAT · <b style="color:#c2c2c9">${platform}</b>${pillarChip(s.pillar)}</div>
    <div style="font-size:15px;font-weight:600;color:#ffffff;margin-bottom:10px;">${escapeHtml(title)}</div>
    ${s.note ? `<div style="font-size:12px;color:#8a8a90;border-left:3px solid #2563EB;padding-left:10px;margin-bottom:12px;">💡 ${escapeHtml(s.note)}</div>` : ""}
    <a href="${link}" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;padding:9px 16px;">Open &amp; download →</a>
  </div>`;
}

// ── Daily reminder ────────────────────────────────────────────────────────────
export function dailyReminderEmail(slots: SlotWithDraft[]): { subject: string; html: string } {
  const n = slots.length;
  const first = slots[0]?.draft?.title ?? "your post";
  const subject = n === 1 ? `📤 Post today: ${first}` : `📤 ${n} posts to publish today`;
  const body = `
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px;">Habari ya asubuhi! ${
      n === 1 ? "You have one post" : `You have ${n} posts`
    } scheduled for today. Open, download, and post 👇</p>
    ${slots.map(slotCard).join("")}`;
  return { subject, html: shell("Today's posting plan", body) };
}

// ── Saturday weekly plan ──────────────────────────────────────────────────────
export function weeklyPlanEmail(slots: SlotWithDraft[], weekStartISO: string): { subject: string; html: string } {
  if (!slots.length) {
    const body = `
      <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px;">
        Next week has no posts planned yet. Take 5 minutes now — the planner suggests a full week
        across your pillars (Code Craft, AI in Practice, Code × AI, Simulations, Build in Public,
        Dev Education, Social Education) and generates every draft for you.</p>
      <a href="${APP_URL}/calendar/plan" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;padding:11px 20px;">✦ Plan my week →</a>`;
    return { subject: "🗓 Your week is empty — plan it in 5 minutes", html: shell("Plan the week ahead", body) };
  }
  const byDay = slots
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .map((s) => {
      const day = new Date(s.scheduledAt).toLocaleDateString("en-GB", {
        weekday: "long",
        timeZone: "Africa/Nairobi",
      });
      return `<tr>
        <td style="padding:8px 10px;font-size:13px;color:#8a8a90;border-bottom:1px solid #1f1f23;white-space:nowrap;">${day}</td>
        <td style="padding:8px 10px;font-size:13px;color:#c2c2c9;border-bottom:1px solid #1f1f23;white-space:nowrap;">${platformMeta(s.platform).label}</td>
        <td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #1f1f23;">
          <a href="${s.draft ? `${APP_URL}/drafts/${s.draft.id}` : APP_URL}" style="color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(s.draft?.title ?? "(draft)")}</a>
          ${pillarChip(s.pillar)}
        </td>
        <td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #1f1f23;">${s.draft ? "✅" : "✍️"}</td>
      </tr>`;
    })
    .join("");
  const body = `
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 20px;">Here's the full plan for the week of ${weekStartISO}.
    Skim it now, prepare anything that needs recording or screenshots, and you're set. Wiki njema!</p>
    <table style="width:100%;border-collapse:collapse;background:#131317;border:1px solid #26262b;border-radius:12px;">${byDay}</table>
    <p style="font-size:13px;color:#8a8a90;margin-top:16px;">✅ = draft ready · ✍️ = needs a draft</p>
    <a href="${APP_URL}/calendar" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;padding:10px 18px;margin-top:8px;">Open the calendar →</a>`;
  return { subject: `🗓 Your posting plan — week of ${weekStartISO}`, html: shell("This week's content plan", body) };
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}
