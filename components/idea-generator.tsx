"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateIdeasAction, saveIdeasAction } from "@/app/actions";
import { PillarBadge } from "@/components/badges";
import { PILLARS, PLATFORMS, platformMeta, type GeneratedIdea, type Pillar, type Platform } from "@/lib/types";

const PLATFORM_VALUES: string[] = PLATFORMS.map((p) => p.value);

export function IdeaGenerator() {
  const router = useRouter();
  const [pillar, setPillar] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(6);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();

  function generate() {
    startGen(async () => {
      try {
        const result = await generateIdeasAction({ pillar: pillar || undefined, topic: topic || undefined, count });
        setIdeas(result);
        setSelected(new Set(result.map((_, i) => i))); // pre-select all
        if (result.length === 0) toast.error("No ideas came back — try again");
      } catch {
        toast.error("Couldn't generate ideas");
      }
    });
  }

  function toggle(i: number) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function saveSelected() {
    const items = [...selected].map((i) => ({
      title: ideas[i].title,
      body: ideas[i].angle,
      pillar: ideas[i].pillar as Pillar,
    }));
    if (!items.length) return;
    startSave(async () => {
      const n = await saveIdeasAction(items);
      toast.success(`Saved ${n} idea${n === 1 ? "" : "s"} to the vault`);
      router.push("/ideas");
      router.refresh();
    });
  }

  const fmtLabel = (f: string) =>
    PLATFORM_VALUES.includes(f) ? platformMeta(f as Platform).label : f;

  return (
    <div className="flex flex-col gap-5">
      {/* controls */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="grid sm:grid-cols-[180px_1fr_120px] gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Pillar</span>
            <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="input">
              <option value="">Any pillar (mix)</option>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Theme / seed (optional)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. RAG, Postgres, building in public…"
              className="input"
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">How many</span>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input">
              {[3, 6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n} ideas
                </option>
              ))}
            </select>
          </label>
        </div>
        <button onClick={generate} disabled={genPending} className="btn btn-primary self-start">
          {genPending ? "Thinking…" : ideas.length ? "Generate more" : "Generate ideas"}
        </button>
      </div>

      {/* results */}
      {ideas.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              {selected.size} of {ideas.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set(ideas.map((_, i) => i)))}
                className="btn btn-ghost text-xs py-1.5"
              >
                Select all
              </button>
              <button onClick={() => setSelected(new Set())} className="btn btn-ghost text-xs py-1.5">
                Clear
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {ideas.map((idea, i) => {
              const on = selected.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className="card card-hover p-4 text-left flex flex-col gap-2 transition"
                  style={on ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 h-4 w-4 rounded border flex items-center justify-center text-[10px] shrink-0"
                      style={
                        on
                          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                          : { borderColor: "var(--border)" }
                      }
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="font-medium leading-snug">{idea.title}</span>
                  </div>
                  {idea.angle && <p className="text-xs text-zinc-400 pl-6">{idea.angle}</p>}
                  <div className="flex items-center gap-2 pl-6 mt-auto pt-1">
                    <PillarBadge pillar={idea.pillar} />
                    <span className="chip text-zinc-400">{fmtLabel(idea.format)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="sticky bottom-4 flex items-center gap-3">
            <button
              onClick={saveSelected}
              disabled={savePending || selected.size === 0}
              className="btn btn-primary"
            >
              {savePending ? "Saving…" : `Save ${selected.size} to vault`}
            </button>
            <span className="text-xs text-zinc-500">They land as sparks, ready to expand.</span>
          </div>
        </>
      )}

      {ideas.length === 0 && !genPending && (
        <div className="card p-10 text-center">
          <div className="text-zinc-400 text-base mb-1">Never run out of ideas</div>
          <p className="text-sm text-zinc-600">
            Pick a pillar (or leave it mixed), optionally add a theme, and generate a batch of
            on-brand content ideas.
          </p>
        </div>
      )}
    </div>
  );
}
