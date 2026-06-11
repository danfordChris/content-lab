"use server";

import { revalidatePath } from "next/cache";
import { mutate, readDB, uid, now } from "@/lib/store";
import {
  expandIdea,
  generateDraft,
  commentToIdea,
  generateImage,
  generateVisual,
  renderSlideCard,
  generateIdeas,
} from "@/lib/ai";
import { effectiveBrand } from "@/lib/types";
import { weekTemplate, postingTip, slotTimeISO, type WeekRow } from "@/lib/planner";
import type {
  BrandSettings,
  GeneratedIdea,
  Draft,
  Idea,
  IdeaStatus,
  DraftStatus,
  Pillar,
  Platform,
} from "@/lib/types";

// ── Ideas ────────────────────────────────────────────────────────────────────
export async function createIdea(input: {
  title: string;
  body?: string;
  pillar?: Pillar;
  sourceUrl?: string;
}): Promise<Idea> {
  const title = input.title?.trim();
  if (!title || title.length < 2) throw new Error("Title too short");
  const idea = await mutate((db) => {
    const i: Idea = {
      id: uid(),
      title,
      body: input.body?.trim() || undefined,
      pillar: input.pillar,
      sourceUrl: input.sourceUrl?.trim() || undefined,
      status: "spark",
      createdAt: now(),
      updatedAt: now(),
    };
    db.ideas.unshift(i);
    return i;
  });
  revalidatePath("/");
  revalidatePath("/ideas");
  return idea;
}

export async function updateIdea(id: string, patch: Partial<Idea>): Promise<void> {
  await mutate((db) => {
    const i = db.ideas.find((x) => x.id === id);
    if (!i) throw new Error("Idea not found");
    Object.assign(i, patch, { updatedAt: now() });
  });
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/ideas");
  revalidatePath("/");
}

export async function setIdeaStatus(id: string, status: IdeaStatus): Promise<void> {
  await updateIdea(id, { status });
}

export async function deleteIdea(id: string): Promise<void> {
  await mutate((db) => {
    db.ideas = db.ideas.filter((x) => x.id !== id);
    db.drafts = db.drafts.filter((d) => d.ideaId !== id);
  });
  revalidatePath("/ideas");
  revalidatePath("/");
}

export async function expandIdeaAction(id: string): Promise<void> {
  const db = await readDB();
  const idea = db.ideas.find((x) => x.id === id);
  if (!idea) throw new Error("Idea not found");
  const brief = await expandIdea(idea, effectiveBrand(db.settings));
  await mutate((d) => {
    const i = d.ideas.find((x) => x.id === id)!;
    i.brief = brief;
    if (i.status === "spark") i.status = "developing";
    if (!i.pillar) i.pillar = brief.suggestedPillar;
    i.updatedAt = now();
  });
  revalidatePath(`/ideas/${id}`);
}

// ── Drafts ───────────────────────────────────────────────────────────────────
export async function generateDraftsAction(
  ideaId: string,
  platforms: Platform[]
): Promise<string[]> {
  const db = await readDB();
  const idea = db.ideas.find((x) => x.id === ideaId);
  if (!idea) throw new Error("Idea not found");

  const generated = await Promise.all(
    platforms.map(async (p) => ({ platform: p, ...(await generateDraft(idea, p, effectiveBrand(db.settings))) }))
  );

  const ids = await mutate((d) => {
    const created: string[] = [];
    for (const g of generated) {
      const draft: Draft = {
        id: uid(),
        ideaId,
        platform: g.platform,
        title: g.title,
        content: g.content,
        status: "draft",
        formatMeta: g.formatMeta,
        createdAt: now(),
        updatedAt: now(),
      };
      d.drafts.unshift(draft);
      created.push(draft.id);
    }
    const i = d.ideas.find((x) => x.id === ideaId)!;
    if (i.status === "developing" || i.status === "spark") i.status = "ready";
    return created;
  });

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath("/drafts");
  return ids;
}

export async function saveDraft(
  id: string,
  patch: { title?: string; content?: string; slideText?: { index: number; text: string } }
): Promise<void> {
  await mutate((db) => {
    const d = db.drafts.find((x) => x.id === id);
    if (!d) throw new Error("Draft not found");
    if (patch.title !== undefined) d.title = patch.title;
    if (patch.content !== undefined) d.content = patch.content;
    if (patch.slideText && d.formatMeta?.slides?.[patch.slideText.index]) {
      d.formatMeta.slides[patch.slideText.index].text = patch.slideText.text;
    }
    d.updatedAt = now();
  });
  revalidatePath(`/drafts/${id}`);
}

// ── Image generation (OpenAI Images) ─────────────────────────────────────────
/** Generate an image for one carousel slide. */
export async function generateSlideImageAction(
  draftId: string,
  slideIndex: number
): Promise<{ ok: boolean; kind: string; placeholder: boolean; error?: string }> {
  const db = await readDB();
  const draft = db.drafts.find((x) => x.id === draftId);
  const slide = draft?.formatMeta?.slides?.[slideIndex];
  if (!draft || !slide) throw new Error("Slide not found");

  // Carousel slides are rendered as branded SVG cards with the REAL slide text
  // (always readable + on-brand), not drawn by an image model.
  const total = draft.formatMeta?.slides?.length ?? 1;
  const url = await renderSlideCard(
    slide.text,
    slideIndex,
    total,
    effectiveBrand(db.settings),
    slide.isOutro
  );
  await mutate((d) => {
    const s = d.drafts.find((x) => x.id === draftId)?.formatMeta?.slides?.[slideIndex];
    if (s) s.imageUrl = url;
  });
  revalidatePath(`/drafts/${draftId}`);
  return { ok: true, kind: "slide", placeholder: false };
}

/** Render branded SVG cards for ALL slides of a carousel in one go. */
export async function generateAllSlidesAction(
  draftId: string
): Promise<{ ok: boolean; count: number }> {
  const db = await readDB();
  const draft = db.drafts.find((x) => x.id === draftId);
  const slides = draft?.formatMeta?.slides;
  if (!draft || !slides?.length) throw new Error("No slides");
  const brand = effectiveBrand(db.settings);
  const urls = await Promise.all(
    slides.map((s, i) => renderSlideCard(s.text, i, slides.length, brand, s.isOutro))
  );
  await mutate((d) => {
    const ss = d.drafts.find((x) => x.id === draftId)?.formatMeta?.slides;
    if (ss) urls.forEach((u, i) => ss[i] && (ss[i].imageUrl = u));
  });
  revalidatePath(`/drafts/${draftId}`);
  return { ok: true, count: urls.length };
}

/** Generate a single cover/visual image for any draft. */
export async function generatePostImageAction(
  draftId: string,
  customPrompt?: string
): Promise<{ ok: boolean; kind: string; placeholder: boolean; error?: string }> {
  const db = await readDB();
  const draft = db.drafts.find((x) => x.id === draftId);
  if (!draft) throw new Error("Draft not found");

  const prompt = customPrompt?.trim() || draft.title || draft.content.slice(0, 120);
  const result = await generateVisual(prompt, draft.title, effectiveBrand(db.settings));
  await mutate((d) => {
    const x = d.drafts.find((y) => y.id === draftId);
    if (x) x.imageUrl = result.url;
  });
  revalidatePath(`/drafts/${draftId}`);
  return { ok: true, kind: result.kind, placeholder: result.kind === "placeholder", error: result.error };
}

export async function setDraftStatus(id: string, status: DraftStatus): Promise<void> {
  await mutate((db) => {
    const d = db.drafts.find((x) => x.id === id);
    if (!d) throw new Error("Draft not found");
    d.status = status;
    d.updatedAt = now();
  });
  revalidatePath(`/drafts/${id}`);
  revalidatePath("/drafts");
}

export async function deleteDraft(id: string): Promise<void> {
  await mutate((db) => {
    db.drafts = db.drafts.filter((x) => x.id !== id);
    db.calendar = db.calendar.filter((c) => c.draftId !== id);
  });
  revalidatePath("/drafts");
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export async function scheduleDraft(draftId: string, scheduledAt: string): Promise<void> {
  await mutate((db) => {
    const d = db.drafts.find((x) => x.id === draftId);
    if (!d) throw new Error("Draft not found");
    db.calendar = db.calendar.filter((c) => c.draftId !== draftId);
    db.calendar.push({
      id: uid(),
      draftId,
      platform: d.platform,
      scheduledAt,
      status: "scheduled",
    });
    d.status = "scheduled";
    d.updatedAt = now();
  });
  revalidatePath("/calendar");
  revalidatePath("/drafts");
  revalidatePath(`/drafts/${draftId}`);
}

export async function markPosted(slotId: string): Promise<void> {
  await mutate((db) => {
    const slot = db.calendar.find((c) => c.id === slotId);
    if (!slot) throw new Error("Slot not found");
    slot.status = "posted";
    slot.postedAt = now();
    const d = db.drafts.find((x) => x.id === slot.draftId);
    if (d) d.status = "posted";
  });
  revalidatePath("/calendar");
  revalidatePath("/");
}

// ── Engagement → idea ────────────────────────────────────────────────────────
export async function commentToIdeaAction(comment: string): Promise<Idea> {
  const text = comment?.trim();
  if (!text) throw new Error("Empty comment");
  const db = await readDB();
  const { title, body } = await commentToIdea(text, effectiveBrand(db.settings));
  const idea = await createIdea({ title, body });
  await updateIdea(idea.id, { sourceComment: text });
  return idea;
}

// ── Idea creator ─────────────────────────────────────────────────────────────
export async function generateIdeasAction(opts: {
  pillar?: string;
  topic?: string;
  count?: number;
}): Promise<GeneratedIdea[]> {
  const db = await readDB();
  return generateIdeas({
    pillar: opts.pillar,
    topic: opts.topic,
    count: opts.count,
    avoidTitles: db.ideas.map((i) => i.title),
    brand: effectiveBrand(db.settings),
  });
}

/** Save chosen generated ideas into the vault. Returns how many were created. */
export async function saveIdeasAction(
  items: { title: string; body?: string; pillar?: Pillar }[]
): Promise<number> {
  const valid = items.filter((i) => i.title?.trim().length >= 2);
  if (!valid.length) return 0;
  await mutate((db) => {
    for (const it of valid) {
      db.ideas.unshift({
        id: uid(),
        title: it.title.trim(),
        body: it.body?.trim() || undefined,
        pillar: it.pillar,
        status: "spark",
        createdAt: now(),
        updatedAt: now(),
      });
    }
  });
  revalidatePath("/ideas");
  revalidatePath("/");
  return valid.length;
}

// ── Weekly planner ───────────────────────────────────────────────────────────
export async function suggestWeekAction(weekStartISO: string): Promise<WeekRow[]> {
  const db = await readDB();
  const brand = effectiveBrand(db.settings);
  const template = weekTemplate(weekStartISO);

  // Ideas already booked on the calendar shouldn't be re-suggested.
  const bookedIdeaIds = new Set(db.calendar.map((c) => c.ideaId).filter(Boolean));
  const available = db.ideas.filter(
    (i) => (i.status === "ready" || i.status === "developing") && !bookedIdeaIds.has(i.id)
  );

  const rows: WeekRow[] = [];
  const taken = new Set<string>();
  for (const t of template) {
    const vaultIdea = available.find((i) => i.pillar === t.pillar && !taken.has(i.id));
    if (vaultIdea) {
      taken.add(vaultIdea.id);
      rows.push({
        ...t,
        enabled: true,
        source: "vault",
        ideaId: vaultIdea.id,
        title: vaultIdea.title,
        angle: vaultIdea.brief?.angle ?? vaultIdea.body?.slice(0, 140),
      });
    } else {
      rows.push({ ...t, enabled: true, source: "ai", title: "", angle: "" });
    }
  }

  // ONE batched AI call for all missing days (respects the free-tier rate limit).
  const missing = rows.filter((r) => r.source === "ai" && !r.title);
  if (missing.length) {
    const generated = await generateIdeas({
      topic: `One idea per pillar, in this exact order: ${missing.map((m) => m.pillar).join(", ")}. Make each idea fit its pillar.`,
      count: missing.length,
      avoidTitles: db.ideas.map((i) => i.title),
      brand,
    });
    missing.forEach((row, i) => {
      // Prefer a generated idea matching the pillar; fall back to positional.
      const match =
        generated.find((g) => g.pillar === row.pillar && !rows.some((r) => r.title === g.title)) ??
        generated[i];
      if (match) {
        row.title = match.title;
        row.angle = match.angle;
      } else {
        row.enabled = false;
      }
    });
  }
  return rows;
}

export type WeekCreateResult = { dayName: string; ok: boolean; title: string; error?: string };

export async function createWeekAction(
  rows: WeekRow[],
  weekStartISO: string
): Promise<WeekCreateResult[]> {
  const results: WeekCreateResult[] = [];
  // Sequential on purpose: stays under the AI rate limit and isolates failures.
  for (const row of rows.filter((r) => r.enabled && r.title.trim().length >= 2)) {
    try {
      const db = await readDB();
      const brand = effectiveBrand(db.settings);

      // 1) Ensure the idea exists in the vault.
      let idea: Idea | undefined = row.ideaId ? db.ideas.find((i) => i.id === row.ideaId) : undefined;
      if (!idea) {
        idea = {
          id: uid(),
          title: row.title.trim(),
          body: row.angle?.trim() || undefined,
          pillar: row.pillar,
          status: "ready",
          createdAt: now(),
          updatedAt: now(),
        };
        await mutate((d) => d.ideas.unshift(idea!));
      }

      // 2) Generate the platform-native draft.
      const g = await generateDraft(idea, row.platform, brand);

      // 3) Create draft + calendar slot in one mutation.
      const scheduledAt = slotTimeISO(weekStartISO, row.dayOffset, row.hour);
      await mutate((d) => {
        const draft: Draft = {
          id: uid(),
          ideaId: idea!.id,
          platform: row.platform,
          title: g.title,
          content: g.content,
          status: "scheduled",
          formatMeta: g.formatMeta,
          createdAt: now(),
          updatedAt: now(),
        };
        d.drafts.unshift(draft);
        d.calendar.push({
          id: uid(),
          draftId: draft.id,
          platform: row.platform,
          scheduledAt,
          status: "scheduled",
          pillar: row.pillar,
          note: postingTip(row.platform),
          ideaId: idea!.id,
        });
        const i = d.ideas.find((x) => x.id === idea!.id);
        if (i) i.status = "used";
      });
      results.push({ dayName: row.dayName, ok: true, title: row.title });
    } catch (e) {
      results.push({
        dayName: row.dayName,
        ok: false,
        title: row.title,
        error: e instanceof Error ? e.message.slice(0, 120) : "failed",
      });
    }
  }
  revalidatePath("/calendar");
  revalidatePath("/drafts");
  revalidatePath("/ideas");
  return results;
}

// ── Brand settings ───────────────────────────────────────────────────────────
export async function getSettings(): Promise<BrandSettings> {
  const db = await readDB();
  // Return the merged brand so the form shows your active defaults (black/white/blue, etc.).
  return effectiveBrand(db.settings);
}

export async function saveSettings(settings: BrandSettings): Promise<void> {
  await mutate((db) => {
    db.settings = settings;
  });
  revalidatePath("/settings");
}

/** Generate a sample image with the CURRENT brand style so the user can preview colors. */
export async function previewBrandImageAction(
  settings: BrandSettings
): Promise<{ url: string; kind: string; placeholder: boolean; error?: string }> {
  // Persist first so future generations use the same style, then render a sample.
  await mutate((db) => {
    db.settings = settings;
  });
  const v = await generateVisual(
    "Diagram explaining how code and AI work together, with a few labeled boxes and arrows, titled <danfordchris/>",
    "Preview",
    effectiveBrand(settings)
  );
  return { url: v.url, kind: v.kind, placeholder: v.kind === "placeholder", error: v.error };
}
