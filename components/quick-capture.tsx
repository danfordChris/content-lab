"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createIdea } from "@/app/actions";
import { PILLARS, type Pillar } from "@/lib/types";

export function QuickCapture({ autoFocus = false }: { autoFocus?: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    if (title.trim().length < 2) return;
    setErr(null);
    const payload = {
      title: title.trim(),
      body: body.trim() || undefined,
      pillar: (pillar || undefined) as Pillar | undefined,
    };
    setTitle("");
    setBody("");
    setPillar("");
    setOpen(false);
    start(async () => {
      try {
        await createIdea(payload);
        toast.success("Idea captured");
        router.refresh();
      } catch {
        setErr("Couldn't save — try again.");
        toast.error("Couldn't save idea");
        setTitle(payload.title);
        setBody(payload.body ?? "");
      }
    });
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        <span className="mono text-zinc-600 px-1">›</span>
        <input
          autoFocus={autoFocus}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Capture a spark…  (Enter to save)"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-zinc-600"
        />
        <button onClick={submit} disabled={pending || title.trim().length < 2} className="btn btn-primary">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional notes — angle, a link, a code snippet…"
            rows={2}
            className="resize-none bg-transparent text-sm outline-none placeholder:text-zinc-700"
          />
          <div className="flex items-center gap-2">
            <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="input max-w-[200px] text-xs py-1.5">
              <option value="">Auto-detect pillar</option>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button onClick={() => setOpen(false)} className="btn btn-ghost text-xs py-1.5">
              Collapse
            </button>
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
