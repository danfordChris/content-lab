import { notFound } from "next/navigation";
import Link from "next/link";
import { readDB } from "@/lib/store";
import { IdeaWorkspace } from "@/components/idea-workspace";

export const dynamic = "force-dynamic";

export default async function IdeaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) notFound();
  const drafts = db.drafts.filter((d) => d.ideaId === id);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/ideas" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Idea Vault
      </Link>
      <IdeaWorkspace idea={idea} drafts={drafts} />
    </div>
  );
}
