import Link from "next/link";
import { readDB } from "@/lib/store";
import { PlatformBadge } from "@/components/badges";
import { MarkPostedButton } from "@/components/calendar-actions";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const db = await readDB();
  const slots = [...db.calendar].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const draftOf = (id: string) => db.drafts.find((d) => d.id === id);

  // group by date
  const groups = new Map<string, typeof slots>();
  for (const s of slots) {
    const day = new Date(s.scheduledAt).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(s);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-zinc-500">Your publishing schedule. Schedule drafts from the editor.</p>
      </header>

      {slots.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          <p className="text-base mb-1">Nothing scheduled.</p>
          <p className="text-sm">
            Open a draft and hit <span className="text-zinc-300">Schedule</span>.{" "}
            <Link href="/drafts" className="text-emerald-400 hover:underline">
              Go to drafts →
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {[...groups.entries()].map(([day, daySlots]) => (
            <div key={day}>
              <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{day}</h2>
              <div className="flex flex-col gap-2">
                {daySlots.map((s) => {
                  const d = draftOf(s.draftId);
                  const time = new Date(s.scheduledAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const overdue = s.status === "scheduled" && new Date(s.scheduledAt).getTime() < Date.now();
                  return (
                    <div key={s.id} className="card p-4 flex items-center gap-3">
                      <span className="mono text-sm text-zinc-400 w-14 shrink-0">{time}</span>
                      <PlatformBadge platform={s.platform} />
                      <div className="min-w-0 flex-1">
                        {d ? (
                          <Link href={`/drafts/${d.id}`} className="text-sm hover:underline truncate block">
                            {d.title}
                          </Link>
                        ) : (
                          <span className="text-sm text-zinc-600">(draft deleted)</span>
                        )}
                      </div>
                      {s.status === "posted" ? (
                        <span className="chip text-emerald-400 border-emerald-900">posted</span>
                      ) : overdue ? (
                        <span className="chip text-amber-400 border-amber-900">overdue</span>
                      ) : (
                        <span className="chip text-violet-300 border-violet-900">scheduled</span>
                      )}
                      {s.status !== "posted" && <MarkPostedButton slotId={s.id} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
