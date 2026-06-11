"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { suggestWeekAction, createWeekAction, type WeekCreateResult } from "@/app/actions";
import { PillarBadge, PlatformBadge } from "@/components/badges";
import { PILLARS, PLATFORMS, type Pillar, type Platform } from "@/lib/types";
import type { WeekRow } from "@/lib/planner";

export function WeekPlanner({ nextMonday, thisMonday }: { nextMonday: string; thisMonday: string }) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(nextMonday);
  const [rows, setRows] = useState<WeekRow[] | null>(null);
  const [suggesting, startSuggest] = useTransition();
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [results, setResults] = useState<WeekCreateResult[] | null>(null);

  function suggest() {
    setResults(null);
    startSuggest(async () => {
      try {
        const r = await suggestWeekAction(weekStart);
        setRows(r);
        const fromVault = r.filter((x) => x.source === "vault").length;
        toast.success(`Week suggested — ${fromVault} from your vault, ${r.length - fromVault} fresh`);
      } catch {
        toast.error("Couldn't build suggestions — try again");
      }
    });
  }

  function patchRow(i: number, patch: Partial<WeekRow>) {
    setRows((r) => (r ? r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)) : r));
  }

  async function createWeek() {
    if (!rows) return;
    const active = rows.filter((r) => r.enabled && r.title.trim().length >= 2);
    if (!active.length) return;
    setCreating(true);
    setProgress(`Creating ${active.length} posts — generating drafts one by one…`);
    try {
      const res = await createWeekAction(rows, weekStart);
      setResults(res);
      const ok = res.filter((r) => r.ok).length;
      toast.success(`Scheduled ${ok} of ${res.length} posts`);
      if (ok === res.length) {
        router.push("/calendar");
        router.refresh();
      }
    } catch {
      toast.error("Something failed while creating the week");
    } finally {
      setCreating(false);
      setProgress(null);
    }
  }

  const enabledCount = rows?.filter((r) => r.enabled && r.title.trim().length >= 2).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* week picker + suggest */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-zinc-500">Week starting (Monday)</span>
          <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input">
            <option value={nextMonday}>Next week — {nextMonday}</option>
            <option value={thisMonday}>This week — {thisMonday}</option>
          </select>
        </label>
        <button onClick={suggest} disabled={suggesting || creating} className="btn btn-primary">
          {suggesting ? "Thinking…" : rows ? "Re-suggest week" : "✦ Suggest my week"}
        </button>
      </div>

      {!rows && !suggesting && (
        <div className="card p-10 text-center">
          <div className="text-zinc-400 text-base mb-1">A creative week of AI basics</div>
          <p className="text-sm text-zinc-600">
            Short-form scripts for LinkedIn, Instagram Reels &amp; TikTok — teaching the AI basics
            most people miss: Claude vs ChatGPT, free vibe-coding tools, building sites &amp; apps
            without code, and automating life with AI. Hit suggest to fill the week.
          </p>
        </div>
      )}

      {/* day rows */}
      {rows && (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div
              key={row.dayOffset}
              className="card p-4 flex flex-col gap-3"
              style={row.enabled ? undefined : { opacity: 0.45 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => patchRow(i, { enabled: !row.enabled })}
                  className="h-5 w-5 rounded border flex items-center justify-center text-[11px] shrink-0"
                  style={
                    row.enabled
                      ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                      : { borderColor: "var(--border)" }
                  }
                  aria-label={`Toggle ${row.dayName}`}
                >
                  {row.enabled ? "✓" : ""}
                </button>
                <span className="font-medium w-24">{row.dayName}</span>
                <span className="text-xs text-zinc-500">{String(row.hour).padStart(2, "0")}:00</span>
                <span
                  className="chip ml-auto"
                  style={
                    row.source === "vault"
                      ? { color: "#34d399", borderColor: "rgba(52,211,153,0.35)" }
                      : { color: "var(--accent)", borderColor: "rgba(37,99,235,0.35)" }
                  }
                >
                  {row.source === "vault" ? "from your vault" : "AI suggestion"}
                </span>
              </div>

              <input
                value={row.title}
                onChange={(e) => patchRow(i, { title: e.target.value, ideaId: undefined, source: "ai" })}
                placeholder="Post title…"
                className="input font-medium"
                disabled={!row.enabled}
              />
              {row.angle && <p className="text-xs text-zinc-500">{row.angle}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={row.platform}
                  onChange={(e) => patchRow(i, { platform: e.target.value as Platform })}
                  className="input max-w-[170px] py-1.5 text-xs"
                  disabled={!row.enabled}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={row.pillar}
                  onChange={(e) => patchRow(i, { pillar: e.target.value as Pillar })}
                  className="input max-w-[180px] py-1.5 text-xs"
                  disabled={!row.enabled}
                >
                  {PILLARS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="hidden sm:flex items-center gap-2 ml-auto">
                  <PlatformBadge platform={row.platform} />
                  <PillarBadge pillar={row.pillar} />
                </div>
              </div>
            </div>
          ))}

          {/* results after creation */}
          {results && (
            <div className="card p-4 flex flex-col gap-1.5">
              {results.map((r) => (
                <div key={r.dayName} className="text-sm flex items-center gap-2">
                  <span>{r.ok ? "✅" : "❌"}</span>
                  <span className="text-zinc-400 w-24">{r.dayName}</span>
                  <span className="truncate">{r.title}</span>
                  {r.error && <span className="text-xs text-red-400 truncate">({r.error})</span>}
                </div>
              ))}
            </div>
          )}

          <div className="sticky bottom-20 md:bottom-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <button onClick={createWeek} disabled={creating || enabledCount === 0} className="btn btn-primary">
              {creating ? "Creating…" : `Create & schedule ${enabledCount} posts`}
            </button>
            <span className="text-xs text-zinc-500">
              {progress ?? "Each post gets a full draft + a how-to-post tip on the calendar."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
