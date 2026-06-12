"use client";

import { useState } from "react";
import { DiscussPanel } from "@/components/discuss-panel";
import { PillarBadge, PlatformBadge, StatusBadge } from "@/components/badges";
import type { Draft, Idea } from "@/lib/types";

type Selection =
  | { kind: "draft"; item: Draft }
  | { kind: "idea"; item: Idea };

export function DiscussWorkspace({ drafts, ideas }: { drafts: Draft[]; ideas: Idea[] }) {
  const [tab, setTab] = useState<"drafts" | "ideas">(drafts.length ? "drafts" : "ideas");
  const [sel, setSel] = useState<Selection | null>(null);

  const empty = drafts.length === 0 && ideas.length === 0;
  if (empty) {
    return (
      <div className="card p-10 text-center text-zinc-500">
        <p className="text-base mb-1">Nothing to discuss yet.</p>
        <p className="text-sm">Capture an idea or generate a draft, then come back here to refine it.</p>
      </div>
    );
  }

  const list = tab === "drafts" ? drafts : ideas;

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      {/* Picker — hidden on mobile once a target is chosen */}
      <div className={`flex flex-col gap-3 ${sel ? "hidden md:flex" : "flex"}`}>
        <div className="flex gap-1.5">
          <TabButton active={tab === "drafts"} onClick={() => setTab("drafts")}>
            Drafts <span className="text-zinc-600">{drafts.length}</span>
          </TabButton>
          <TabButton active={tab === "ideas"} onClick={() => setTab("ideas")}>
            Ideas <span className="text-zinc-600">{ideas.length}</span>
          </TabButton>
        </div>
        <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="text-sm text-zinc-600 px-1">No {tab} yet.</p>
          ) : tab === "drafts" ? (
            drafts.map((d) => (
              <PickerCard
                key={d.id}
                active={sel?.kind === "draft" && sel.item.id === d.id}
                onClick={() => setSel({ kind: "draft", item: d })}
                badges={
                  <>
                    <PlatformBadge platform={d.platform} />
                    <StatusBadge status={d.status} />
                  </>
                }
                title={d.title}
                snippet={d.content}
              />
            ))
          ) : (
            ideas.map((i) => (
              <PickerCard
                key={i.id}
                active={sel?.kind === "idea" && sel.item.id === i.id}
                onClick={() => setSel({ kind: "idea", item: i })}
                badges={
                  <>
                    <PillarBadge pillar={i.pillar} />
                    <StatusBadge status={i.status} />
                  </>
                }
                title={i.title}
                snippet={i.body ?? ""}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`${sel ? "block" : "hidden md:block"}`}>
        {sel ? (
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSel(null)}
                className="md:hidden btn btn-ghost text-xs py-1 px-2"
                aria-label="Back to list"
              >
                ←
              </button>
              {sel.kind === "draft" ? (
                <PlatformBadge platform={sel.item.platform} />
              ) : (
                <PillarBadge pillar={sel.item.pillar} />
              )}
              <span className="text-sm font-medium truncate">{sel.item.title}</span>
            </div>
            <DiscussPanel
              key={`${sel.kind}-${sel.item.id}`}
              kind={sel.kind}
              id={sel.item.id}
              platform={sel.kind === "draft" ? sel.item.platform : undefined}
              initialChat={sel.item.chat ?? []}
              withPublish
            />
          </div>
        ) : (
          <div className="hidden md:grid place-items-center card p-10 text-sm text-zinc-500 h-full">
            Pick a draft or idea to start the conversation.
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
        active ? "bg-[var(--accent-soft)] text-white" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function PickerCard({
  active,
  onClick,
  badges,
  title,
  snippet,
}: {
  active: boolean;
  onClick: () => void;
  badges: React.ReactNode;
  title: string;
  snippet: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-3 text-left flex flex-col gap-1.5 transition hover:border-zinc-700 ${
        active ? "border-[var(--accent)]" : ""
      }`}
    >
      <div className="flex items-center gap-2">{badges}</div>
      <div className="text-sm font-medium truncate">{title}</div>
      {snippet && <p className="text-xs text-zinc-500 line-clamp-2 whitespace-pre-wrap">{snippet}</p>}
    </button>
  );
}
