import Link from "next/link";
import { readDB } from "@/lib/store";
import { PlatformBadge, StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const db = await readDB();
  const drafts = db.drafts;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Drafts</h1>
        <p className="text-sm text-zinc-500">Everything you've generated, ready to polish and ship.</p>
      </header>

      {drafts.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          <p className="text-base mb-1">No drafts yet.</p>
          <p className="text-sm">
            Open an idea and generate content. <Link href="/ideas" className="text-[var(--accent)] hover:underline">Go to the vault →</Link>
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {drafts.map((d) => (
            <Link key={d.id} href={`/drafts/${d.id}`} className="card p-4 hover:border-zinc-700 transition flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={d.platform} />
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs text-zinc-500 line-clamp-3 whitespace-pre-wrap">{d.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
