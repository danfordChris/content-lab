// examples/idea-capture-form.tsx
// Quick-capture form for the Idea Vault. Optimistic, never blocks on AI.
// Drop into a dialog opened by Cmd+K, or render inline as the dashboard omnibox.
"use client";

import { useState, useTransition } from "react";
import { createIdea } from "@/app/_actions/ideas";

const PILLARS = [
  { value: "code_craft", label: "Code Craft" },
  { value: "ai_practice", label: "AI in Practice" },
  { value: "code_x_ai", label: "Code × AI" },
  { value: "simulations", label: "Simulations" },
  { value: "build_in_public", label: "Build in Public" },
  { value: "dev_education", label: "Dev Education" },
] as const;

export function IdeaCaptureForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (title.trim().length < 2) return;
    setError(null);
    const payload = {
      title: title.trim(),
      body: body.trim() || undefined,
      pillar: pillar || undefined,
    };
    // Clear immediately — capture should feel instant.
    setTitle("");
    setBody("");
    setPillar("");
    startTransition(async () => {
      try {
        await createIdea(payload);
        onCreated?.();
      } catch (e) {
        setError("Couldn't save — your idea is restored below.");
        setTitle(payload.title);
        setBody(payload.body ?? "");
        setPillar(payload.pillar ?? "");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Capture a spark…  (Enter to save)"
        className="bg-transparent text-lg text-zinc-100 outline-none placeholder:text-zinc-600"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional notes — what's the angle? a link? a code snippet?"
        rows={2}
        className="resize-none bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-700"
      />
      <div className="flex items-center justify-between">
        <select
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="">Auto-detect pillar</option>
          {PILLARS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={isPending || title.trim().length < 2}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save idea"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
