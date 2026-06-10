import Link from "next/link";
import { readDB } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { QuickCapture } from "@/components/quick-capture";
import { PillarBadge, StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard() {
  const db = await readDB();
  const ideas = db.ideas.filter((i) => i.status !== "archived");
  const sparks = ideas.filter((i) => i.status === "spark");
  const ready = db.drafts.filter((d) => d.status === "ready" || d.status === "draft");
  const postedThisWeek = db.calendar.filter(
    (c) => c.status === "posted" && Date.now() - new Date(c.postedAt ?? 0).getTime() < 7 * 864e5
  ).length;

  const stats = [
    { label: "Ideas in vault", value: ideas.length, href: "/ideas", accent: false },
    { label: "Sparks to develop", value: sparks.length, href: "/ideas", accent: sparks.length > 0 },
    { label: "Drafts in progress", value: ready.length, href: "/drafts", accent: false },
    { label: "Posted this week", value: postedThisWeek, href: "/calendar", accent: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{greeting()}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {sparks.length} spark{sparks.length === 1 ? "" : "s"} waiting · {ready.length} draft
            {ready.length === 1 ? "" : "s"} in progress
            {!aiEnabled && " · built-in generator (add a key for live AI)"}
          </p>
        </div>
        <span className="kbd hidden sm:inline-flex items-center gap-1 mt-1">⌘K</span>
      </header>

      <QuickCapture autoFocus />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover p-4 transition">
            <div className="text-2xl font-semibold" style={s.accent ? { color: "var(--accent)" } : undefined}>
              {s.value}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-zinc-400">Recent ideas</h2>
          <Link href="/ideas" className="text-xs text-[var(--accent)] hover:underline">
            View all →
          </Link>
        </div>
        {ideas.length === 0 ? (
          <div className="card p-10 text-center flex flex-col items-center gap-3">
            <div>
              <div className="text-zinc-400 text-base mb-1">No ideas yet</div>
              <p className="text-sm text-zinc-600">
                Drop a spark above, press <span className="kbd">⌘K</span>, or let AI generate a batch.
              </p>
            </div>
            <Link href="/ideas/generate" className="btn btn-primary text-sm">
              ✦ Generate ideas
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ideas.slice(0, 6).map((i) => (
              <Link
                key={i.id}
                href={`/ideas/${i.id}`}
                className="card card-hover p-4 flex items-center justify-between gap-3 transition"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.title}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <PillarBadge pillar={i.pillar} />
                    <StatusBadge status={i.status} />
                    {i.brief && (
                      <span
                        className="chip"
                        style={{ color: "var(--accent)", borderColor: "rgba(37,99,235,0.35)" }}
                      >
                        expanded
                      </span>
                    )}
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
