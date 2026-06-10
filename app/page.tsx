import Link from "next/link";
import { readDB } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { QuickCapture } from "@/components/quick-capture";
import { PillarBadge, StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const db = await readDB();
  const ideas = db.ideas.filter((i) => i.status !== "archived");
  const sparks = ideas.filter((i) => i.status === "spark");
  const ready = db.drafts.filter((d) => d.status === "ready" || d.status === "draft");
  const scheduled = db.calendar.filter((c) => c.status === "scheduled");
  const postedThisWeek = db.calendar.filter(
    (c) => c.status === "posted" && Date.now() - new Date(c.postedAt ?? 0).getTime() < 7 * 864e5
  ).length;

  const stats = [
    { label: "Ideas in vault", value: ideas.length, href: "/ideas" },
    { label: "Sparks to develop", value: sparks.length, href: "/ideas" },
    { label: "Drafts in progress", value: ready.length, href: "/drafts" },
    { label: "Posted this week", value: postedThisWeek, href: "/calendar" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Content Lab</h1>
        <p className="text-sm text-zinc-500">
          Capture an idea, expand it, generate posts. {aiEnabled ? "AI is live." : "Running with the built-in generator — add an OPENAI_API_KEY for live AI."}
        </p>
      </header>

      <QuickCapture autoFocus />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-zinc-700 transition">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-zinc-400">Recent ideas</h2>
          <Link href="/ideas" className="text-xs text-emerald-400 hover:underline">
            View all →
          </Link>
        </div>
        {ideas.length === 0 ? (
          <div className="card p-8 text-center text-zinc-500">
            <p className="text-base mb-1">No ideas yet.</p>
            <p className="text-sm">Drop your first spark above — it all starts there.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ideas.slice(0, 6).map((i) => (
              <Link
                key={i.id}
                href={`/ideas/${i.id}`}
                className="card p-4 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.title}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <PillarBadge pillar={i.pillar} />
                    <StatusBadge status={i.status} />
                    {i.brief && <span className="chip text-emerald-400 border-emerald-900">expanded</span>}
                  </div>
                </div>
                <span className="text-zinc-600 shrink-0">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
