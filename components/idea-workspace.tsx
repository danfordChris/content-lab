"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  expandIdeaAction,
  generateDraftsAction,
  updateIdea,
  setIdeaStatus,
  deleteIdea,
} from "@/app/actions";
import { PillarBadge, StatusBadge, PlatformBadge } from "@/components/badges";
import { PILLARS, PLATFORMS, type Draft, type Idea, type IdeaStatus, type Platform, type Pillar } from "@/lib/types";

export function IdeaWorkspace({ idea, drafts }: { idea: Idea; drafts: Draft[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [title, setTitle] = useState(idea.title);
  const [body, setBody] = useState(idea.body ?? "");
  const [picked, setPicked] = useState<Platform[]>(["linkedin", "x"]);

  function saveMeta(patch: Partial<Idea>) {
    start(async () => {
      await updateIdea(idea.id, patch);
      router.refresh();
    });
  }

  function expand() {
    setBusy("expand");
    start(async () => {
      await expandIdeaAction(idea.id);
      setBusy(null);
      router.refresh();
    });
  }

  function generate() {
    if (picked.length === 0) return;
    setBusy("generate");
    start(async () => {
      await generateDraftsAction(idea.id, picked);
      setBusy(null);
      router.refresh();
    });
  }

  function togglePlatform(p: Platform) {
    setPicked((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header / edit */}
      <div className="card p-5 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== idea.title && saveMeta({ title: title.trim() })}
          className="bg-transparent text-xl font-semibold outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => body !== (idea.body ?? "") && saveMeta({ body: body.trim() })}
          placeholder="Notes, angle, links, snippets…"
          rows={3}
          className="resize-none bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-700"
        />
        <div className="flex flex-wrap items-center gap-2">
          <PillarBadge pillar={idea.pillar} />
          <StatusBadge status={idea.status} />
          <div className="ml-auto flex items-center gap-2">
            <select
              value={idea.pillar ?? ""}
              onChange={(e) => saveMeta({ pillar: (e.target.value || undefined) as Pillar })}
              className="input max-w-[160px] py-1.5 text-xs"
            >
              <option value="">Set pillar</option>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={idea.status}
              onChange={(e) => saveMeta({ status: e.target.value as IdeaStatus })}
              className="input max-w-[140px] py-1.5 text-xs capitalize"
            >
              {(["spark", "developing", "ready", "used", "archived"] as IdeaStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        {idea.sourceComment && (
          <div className="text-xs text-zinc-500 border-l-2 border-zinc-700 pl-3">
            Recycled from a comment: “{idea.sourceComment}”
          </div>
        )}
      </div>

      {/* AI expansion */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-300">AI brief</h2>
          <button onClick={expand} disabled={pending} className="btn btn-ghost text-xs py-1.5">
            {busy === "expand" ? "Thinking…" : idea.brief ? "Regenerate" : "Expand with AI"}
          </button>
        </div>
        {!idea.brief ? (
          <p className="text-sm text-zinc-500">
            This is a raw spark. Expand it into an angle, outline, and hooks →
          </p>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <Field label="Angle">{idea.brief.angle}</Field>
            <Field label="Why now">{idea.brief.whyNow}</Field>
            <div>
              <Label>Outline</Label>
              <ul className="mt-1 list-disc pl-5 text-zinc-300 space-y-0.5">
                {idea.brief.outline.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <Label>Hooks</Label>
              <div className="mt-1 flex flex-col gap-1.5">
                {idea.brief.hooks.map((h, i) => (
                  <div key={i} className="rounded-md bg-zinc-900/60 px-3 py-2 text-zinc-200">
                    {h}
                  </div>
                ))}
              </div>
            </div>
            {idea.brief.examples?.length > 0 && (
              <Field label="Examples">{idea.brief.examples.join(" · ")}</Field>
            )}
          </div>
        )}
      </div>

      {/* Generate content */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Generate content</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {PLATFORMS.map((p) => {
            const on = picked.includes(p.value);
            return (
              <button
                key={p.value}
                onClick={() => togglePlatform(p.value)}
                className="chip"
                style={{
                  color: on ? "#fff" : p.color,
                  background: on ? p.color : "transparent",
                  borderColor: p.color + "66",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <button onClick={generate} disabled={pending || picked.length === 0} className="btn btn-primary">
          {busy === "generate" ? "Generating…" : `Generate ${picked.length} format${picked.length === 1 ? "" : "s"}`}
        </button>
      </div>

      {/* Drafts */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">
          Drafts {drafts.length > 0 && <span className="text-zinc-600">({drafts.length})</span>}
        </h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-zinc-600">No drafts yet — generate some above.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((d) => (
              <Link
                key={d.id}
                href={`/drafts/${d.id}`}
                className="card p-4 hover:border-zinc-700 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PlatformBadge platform={d.platform} />
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 whitespace-pre-wrap">{d.content}</p>
                </div>
                <span className="text-zinc-600 shrink-0">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (confirm("Delete this idea and its drafts?")) {
            start(async () => {
              await deleteIdea(idea.id);
              router.push("/ideas");
            });
          }
        }}
        className="self-start text-xs text-red-500/70 hover:text-red-400"
      >
        Delete idea
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] uppercase tracking-wide text-zinc-500">{children}</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="mt-0.5 text-zinc-200">{children}</p>
    </div>
  );
}
