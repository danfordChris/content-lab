import { pillarMeta, platformMeta, type Pillar, type Platform, type IdeaStatus, type DraftStatus } from "@/lib/types";

export function PillarBadge({ pillar }: { pillar?: Pillar }) {
  const m = pillarMeta(pillar);
  if (!m) return <span className="chip text-zinc-500">No pillar</span>;
  return (
    <span className="chip" style={{ color: m.color, borderColor: m.color + "44" }}>
      <span style={{ background: m.color }} className="h-2 w-2 rounded-full" />
      {m.label}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const m = platformMeta(platform);
  return (
    <span className="chip" style={{ color: m.color, borderColor: m.color + "44" }}>
      {m.label}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  spark: "#fbbf24",
  developing: "#38bdf8",
  ready: "#34d399",
  used: "#71717a",
  archived: "#52525b",
  draft: "#a1a1aa",
  scheduled: "#a78bfa",
  posted: "#34d399",
};

export function StatusBadge({ status }: { status: IdeaStatus | DraftStatus }) {
  const c = STATUS_COLORS[status] ?? "#a1a1aa";
  return (
    <span className="chip capitalize" style={{ color: c, borderColor: c + "44" }}>
      {status}
    </span>
  );
}
