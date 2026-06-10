"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPosted } from "@/app/actions";

export function MarkPostedButton({ slotId }: { slotId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        start(async () => {
          await markPosted(slotId);
          router.refresh();
        })
      }
      disabled={pending}
      className="btn btn-ghost text-xs py-1 px-2 shrink-0"
    >
      {pending ? "…" : "Mark posted"}
    </button>
  );
}
