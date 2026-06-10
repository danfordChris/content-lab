import { notFound } from "next/navigation";
import Link from "next/link";
import { readDB } from "@/lib/store";
import { DraftEditor } from "@/components/draft-editor";

export const dynamic = "force-dynamic";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const draft = db.drafts.find((d) => d.id === id);
  if (!draft) notFound();
  const idea = db.ideas.find((i) => i.id === draft.ideaId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/drafts" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Drafts
        </Link>
        {idea && (
          <Link href={`/ideas/${idea.id}`} className="text-xs text-zinc-500 hover:text-zinc-300">
            From idea: {idea.title} ↗
          </Link>
        )}
      </div>
      <DraftEditor draft={draft} />
    </div>
  );
}
