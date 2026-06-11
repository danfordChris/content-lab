import Link from "next/link";
import { WeekPlanner } from "@/components/week-planner";
import { nextMondayISO, thisMondayISO } from "@/lib/planner";

export const dynamic = "force-dynamic";

export default function PlanWeekPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/calendar" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Calendar
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Plan my week</h1>
        <p className="text-sm text-zinc-500">
          One pillar a day. Pull from your vault, let AI fill the gaps, then create and schedule the
          whole week in one go.
        </p>
      </div>
      <WeekPlanner nextMonday={nextMondayISO()} thisMonday={thisMondayISO()} />
    </div>
  );
}
