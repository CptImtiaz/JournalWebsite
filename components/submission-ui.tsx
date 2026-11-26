import { MANUSCRIPT_STATUSES } from "@/lib/constants";

const ACTION = ["REVISION_REQUIRED"];
const CLOSED = ["REJECTED", "WITHDRAWN"];
export function StatusPill({ status }: { status: string }) {
  const cls = ACTION.includes(status) ? "border-[#B8862B] text-[#7A5A12]" : CLOSED.includes(status) ? "border-[#C9CDD3] text-ink/60" : "border-navy/40 text-navy";
  return <span className={`inline-block whitespace-nowrap rounded-[3px] border px-2 py-0.5 text-xs font-medium ${cls}`}>{MANUSCRIPT_STATUSES[status as keyof typeof MANUSCRIPT_STATUSES] ?? status}</span>;
}

export function Bar({ pct }: { pct: number }) {
  return <div className="h-1 w-full bg-[#E6E8EB]"><div className="h-full bg-navy transition-all" style={{ width: `${pct}%` }} /></div>;
}
