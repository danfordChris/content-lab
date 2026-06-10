import Link from "next/link";
import { readDB } from "@/lib/store";
import { QuickCapture } from "@/components/quick-capture";
import { PillarBadge, StatusBadge } from "@/components/badges";
import { PILLARS, type IdeaStatus, type Pillar } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: IdeaStatus[] = ["spark", "developing", "ready", "used", "archived"];

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pillar?: string }>;
}) {
  const sp = await searchParams;
  const db = await readDB();
  let ideas = db.ideas;

  if (sp.q) {
    const q = sp.q.toLowerCase();
    ideas = ideas.filter((i) => (i.title + " " + (i.body ?? "")).toLowerCase().includes(q));
  }
  if (sp.status) ideas = ideas.filter((i) => i.status === sp.status);
  if (sp.pillar) ideas = ideas.filter((i) => i.pillar === sp.pillar);

  const draftCount = (id: string) => db.drafts.filter((d) => d.ideaId === id).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Idea Vault</h1>
          <p className="text-sm text-zinc-500">Every spark, never lost.</p>
        </div>
        <Link href="/ideas/generate" className="btn btn-primary text-sm shrink-0">
          ✦ Generate ideas
        </Link>
      </header>

      <QuickCapture />

      <form className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search ideas…"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-[160px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="pillar" defaultValue={sp.pillar ?? ""} className="input max-w-[180px]">
          <option value="">All pillars</option>
          {PILLARS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost">Filter</button>
        {(sp.q || sp.status || sp.pillar) && (
          <Link href="/ideas" className="text-xs text-zinc-500 hover:text-zinc-300">
            Clear
          </Link>
        )}
      </form>

      {ideas.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          <p className="text-base mb-1">No ideas match.</p>
          <p className="text-sm">Capture one above, or clear filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {ideas.map((i) => (
            <Link
              key={i.id}
              href={`/ideas/${i.id}`}
              className="card p-4 hover:border-zinc-700 transition flex flex-col gap-2"
            >
              <div className="font-medium leading-snug">{i.title}</div>
              {i.body && <p className="text-xs text-zinc-500 line-clamp-2">{i.body}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                <PillarBadge pillar={i.pillar} />
                <StatusBadge status={i.status} />
                {i.brief && (
                  <span className="chip" style={{ color: "var(--accent)", borderColor: "rgba(37,99,235,0.35)" }}>
                    expanded
                  </span>
                )}
                {draftCount(i.id) > 0 && (
                  <span className="chip text-zinc-400">{draftCount(i.id)} drafts</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
