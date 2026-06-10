import Link from "next/link";
import { IdeaGenerator } from "@/components/idea-generator";

export const dynamic = "force-dynamic";

export default function GenerateIdeasPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/ideas" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Idea Vault
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Idea Generator</h1>
        <p className="text-sm text-zinc-500">
          Let the AI propose fresh, on-brand content ideas — pick the good ones into your vault.
        </p>
      </div>
      <IdeaGenerator />
    </div>
  );
}
