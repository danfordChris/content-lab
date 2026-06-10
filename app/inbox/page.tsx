import Link from "next/link";
import { readDB } from "@/lib/store";
import { InboxConverter } from "@/components/inbox-converter";
import { PillarBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const db = await readDB();
  const recycled = db.ideas.filter((i) => i.sourceComment);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Engagement Inbox</h1>
        <p className="text-sm text-zinc-500">
          The recycling engine. Paste an audience comment or question → turn it into your next post.
        </p>
      </header>

      <InboxConverter />

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">Recycled into ideas</h2>
        {recycled.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Nothing yet. Paste a comment above — your audience is your best idea source.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recycled.map((i) => (
              <Link key={i.id} href={`/ideas/${i.id}`} className="card p-4 hover:border-zinc-700 transition">
                <div className="font-medium">{i.title}</div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">“{i.sourceComment}”</p>
                <div className="mt-2">
                  <PillarBadge pillar={i.pillar} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
