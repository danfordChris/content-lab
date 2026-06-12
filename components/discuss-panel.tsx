"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { discussAction, applyRevisionAction, scheduleDraft } from "@/app/actions";
import type { ChatMessage, Platform } from "@/lib/types";

const STARTERS: Record<"draft" | "idea", string[]> = {
  draft: [
    "Make the hook punchier",
    "Tighten this and add a clear CTA",
    "Rewrite it for a beginner audience",
  ],
  idea: [
    "Sharpen the title",
    "Turn this into a clearer angle",
    "Who is the audience and why now?",
  ],
};

export function DiscussPanel({
  kind,
  id,
  initialChat,
  platform,
  withPublish = false,
}: {
  kind: "draft" | "idea";
  id: string;
  initialChat: ChatMessage[];
  platform?: Platform;
  withPublish?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, start] = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);

  // Re-seed when switching targets (the global tab reuses one panel instance).
  useEffect(() => {
    setMessages(initialChat);
    setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    (async () => {
      try {
        const reply = await discussAction(kind, id, msg);
        setMessages((m) => [...m, reply]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "The AI couldn't respond");
        // roll back the optimistic user bubble
        setMessages((m) => (m[m.length - 1]?.role === "user" ? m.slice(0, -1) : m));
        setInput(msg);
      } finally {
        setSending(false);
      }
    })();
  }

  function apply(index: number) {
    start(async () => {
      try {
        await applyRevisionAction(kind, id, index);
        setMessages((m) => m.map((x, i) => (i === index ? { ...x, applied: true } : x)));
        toast.success(kind === "draft" ? "Applied to draft" : "Applied to idea");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't apply");
      }
    });
  }

  function schedulePublish() {
    const when = prompt("Schedule for (YYYY-MM-DD HH:MM)", defaultWhen());
    if (!when) return;
    const iso = new Date(when.replace(" ", "T")).toISOString();
    if (isNaN(Date.parse(iso))) {
      toast.error("Couldn't read that date");
      return;
    }
    start(async () => {
      await scheduleDraft(id, iso);
      toast.success("Scheduled — sent to your calendar");
      router.push("/calendar");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={threadRef}
        className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <div className="text-sm text-zinc-500">
            <p className="mb-2">
              Chat with the AI to refine this {kind}. When it suggests a rewrite, you&apos;ll get an{" "}
              <span className="text-zinc-300">Apply</span> button.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTERS[kind].map((s) => (
                <button key={s} onClick={() => send(s)} className="chip text-xs hover:border-zinc-600">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} m={m} onApply={() => apply(i)} busy={pending} />)
        )}
        {sending && (
          <div className="self-start text-xs text-zinc-500 italic px-1">Thinking…</div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder={`Ask the AI to refine this ${kind}…  (Enter to send)`}
          className="input flex-1 resize-y text-sm py-2"
        />
        <button
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          className="btn btn-primary text-xs py-2 disabled:opacity-40"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>

      {withPublish && kind === "draft" && (
        <button
          onClick={schedulePublish}
          disabled={pending}
          className="btn btn-primary self-start text-xs py-1.5"
        >
          ✓ Schedule &amp; publish
        </button>
      )}
    </div>
  );
}

function Bubble({ m, onApply, busy }: { m: ChatMessage; onApply: () => void; busy: boolean }) {
  if (m.role === "user") {
    return (
      <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--accent)] px-3.5 py-2 text-sm text-white whitespace-pre-wrap">
        {m.content}
      </div>
    );
  }
  return (
    <div className="self-start max-w-[90%] flex flex-col gap-2">
      <div className="rounded-2xl rounded-bl-sm border border-[var(--border)] bg-black/20 px-3.5 py-2 text-sm text-zinc-200 whitespace-pre-wrap">
        {m.content}
      </div>
      {m.revision && (
        <div className="rounded-lg border border-[var(--border)] bg-zinc-900/50 p-3 flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Proposed revision</div>
          {m.revision.title && (
            <div className="text-sm font-medium text-zinc-100">{m.revision.title}</div>
          )}
          {m.revision.text && (
            <p className="text-xs text-zinc-400 line-clamp-6 whitespace-pre-wrap">{m.revision.text}</p>
          )}
          {m.applied ? (
            <span className="self-start text-xs text-emerald-400">Applied ✓</span>
          ) : (
            <button
              onClick={onApply}
              disabled={busy}
              className="btn btn-ghost self-start text-xs py-1 disabled:opacity-40"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function defaultWhen(): string {
  const d = new Date(Date.now() + 864e5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 09:00`;
}
