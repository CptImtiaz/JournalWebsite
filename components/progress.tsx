import { TRACKING_STAGES } from "@/lib/constants";

/** Compact 6-step progress bar for a manuscript. */
export function StageBar({ status }: { status: string }) {
  const idx = TRACKING_STAGES.findIndex((s) => s.statuses.includes(status));
  const stopped = status === "REJECTED" || status === "WITHDRAWN";
  return (
    <div>
      <div className="flex gap-1">
        {TRACKING_STAGES.map((s, i) => (
          <span key={s.label} title={s.label} className={`h-1.5 flex-1 ${status === "PUBLISHED" || i < idx ? "bg-[#EEF1F6]0" : i === idx ? (stopped ? "bg-[#FBF6EA]0" : "bg-brand") : "bg-line"}`} />
        ))}
      </div>
      <div className="mt-1.5 text-xs text-muted">{stopped ? (status === "REJECTED" ? "Decision: not accepted" : "Withdrawn") : `Step ${Math.max(idx, 0) + 1} of ${TRACKING_STAGES.length} · ${TRACKING_STAGES[Math.max(idx, 0)].label}`}</div>
    </div>
  );
}
