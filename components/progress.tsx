import { TRACKING_STAGES } from "@/lib/constants";

/** Compact 6-step progress bar for a manuscript. */
export function StageBar({ status }: { status: string }) {
  const idx = TRACKING_STAGES.findIndex((s) => s.statuses.includes(status));
  const stopped = status === "REJECTED" || status === "WITHDRAWN";
  return (
    <div>
      <div className="flex gap-1">
        {TRACKING_STAGES.map((s, i) => (
          <span key={s.label} title={s.label} className={`h-1.5 flex-1 rounded-full ${status === "PUBLISHED" || i < idx ? "bg-emerald-500" : i === idx ? (stopped ? "bg-red-500" : "bg-brand") : "bg-line"}`} />
        ))}
      </div>
      <div className="mt-1.5 text-xs text-muted">{stopped ? (status === "REJECTED" ? "Decision: not accepted" : "Withdrawn") : `Step ${Math.max(idx, 0) + 1} of ${TRACKING_STAGES.length} · ${TRACKING_STAGES[Math.max(idx, 0)].label}`}</div>
    </div>
  );
}
