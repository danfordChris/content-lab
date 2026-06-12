import { readDB } from "@/lib/store";
import { DiscussWorkspace } from "@/components/discuss-workspace";

export const dynamic = "force-dynamic";

export default async function DiscussPage() {
  const db = await readDB();
  // Most-recently-updated first, so the thing you're working on is at the top.
  const byUpdated = (a: { updatedAt: string }, b: { updatedAt: string }) =>
    b.updatedAt.localeCompare(a.updatedAt);
  const drafts = [...db.drafts].sort(byUpdated);
  const ideas = [...db.ideas].sort(byUpdated);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Discuss</h1>
        <p className="text-sm text-zinc-500">
          Talk through a draft or idea with the AI, apply the rewrites you like, then publish.
        </p>
      </header>
      <DiscussWorkspace drafts={drafts} ideas={ideas} />
    </div>
  );
}
