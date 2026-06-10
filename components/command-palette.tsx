"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { createIdea } from "@/app/actions";

const NAV = [
  { href: "/", label: "Go to Dashboard" },
  { href: "/ideas", label: "Go to Idea Vault" },
  { href: "/drafts", label: "Go to Drafts" },
  { href: "/calendar", label: "Go to Calendar" },
  { href: "/inbox", label: "Go to Inbox" },
  { href: "/settings", label: "Go to Settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [open]);

  if (!open || pathname === "/login") return null;

  const matches = NAV.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()));

  function capture() {
    const title = q.trim();
    if (title.length < 2) return;
    setOpen(false);
    start(async () => {
      try {
        await createIdea({ title });
        toast.success("Idea captured");
        router.refresh();
      } catch {
        toast.error("Couldn't save idea");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg card overflow-hidden"
        style={{ background: "var(--panel-2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <span className="mono text-[var(--accent)]">›</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && q.trim().length >= 2 && matches.length === 0 && capture()}
            placeholder="Capture an idea, or jump to…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-zinc-600"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {q.trim().length >= 2 && (
            <button
              onClick={capture}
              disabled={pending}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-[var(--accent-soft)]"
            >
              <span className="text-[var(--accent)]">+</span>
              Capture idea: <span className="text-white">“{q.trim()}”</span>
            </button>
          )}
          {matches.map((n) => (
            <button
              key={n.href}
              onClick={() => {
                setOpen(false);
                router.push(n.href);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-300 hover:bg-zinc-900"
            >
              <span className="text-zinc-600">→</span>
              {n.label}
            </button>
          ))}
          {matches.length === 0 && q.trim().length < 2 && (
            <p className="px-4 py-3 text-xs text-zinc-600">Type to capture an idea or search pages.</p>
          )}
        </div>
      </div>
    </div>
  );
}
