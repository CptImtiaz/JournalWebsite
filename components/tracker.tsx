import { TRACKING_STAGES } from "@/lib/constants";

export function Tracker({ status }: { status: string }) {
  const idx = TRACKING_STAGES.findIndex((s) => s.statuses.includes(status));
  const terminal = status === "REJECTED" || status === "WITHDRAWN";
  return (
    <ol className="grid gap-3 sm:grid-cols-6">
      {TRACKING_STAGES.map((s, i) => {
        const done = !terminal && (i < idx || status === "PUBLISHED");
        const cur = i === idx;
        return (
          <li key={s.label} className="flex items-center gap-2 sm:flex-col sm:items-start">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-navy text-white" : cur ? (terminal ? "bg-ink text-white" : "bg-brand text-white") : "bg-gray-100 text-muted"}`}>{done ? "✓" : i + 1}</span>
            <span className={`text-xs ${cur ? "font-semibold text-ink" : "text-muted"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
