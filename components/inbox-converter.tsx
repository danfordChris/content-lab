"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commentToIdeaAction } from "@/app/actions";

export function InboxConverter() {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function convert() {
    if (text.trim().length < 3) return;
    const comment = text.trim();
    setText("");
    start(async () => {
      const idea = await commentToIdeaAction(comment);
      router.push(`/ideas/${idea.id}`);
    });
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a comment, DM, or question your audience asked…"
        rows={3}
        className="resize-none bg-transparent text-sm outline-none placeholder:text-zinc-600"
      />
      <button onClick={convert} disabled={pending || text.trim().length < 3} className="btn btn-primary self-start">
        {pending ? "Converting…" : "Turn into idea →"}
      </button>
    </div>
  );
}
