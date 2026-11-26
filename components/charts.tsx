"use client";
import { useState } from "react";

/** Single-series column chart. One series → no legend; the card title names it. */
export function ColumnChart({ data, height = 200, unit = "" }: { data: { label: string; value: number; full?: string }[]; height?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = Math.max(1, Math.ceil(max / 4) * 4);
  const ticks = [0, nice / 4, nice / 2, (3 * nice) / 4, nice];
  const W = 640, H = height, L = 32, B = 26, T = 10;
  const bw = (W - L) / data.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / nice);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Column chart: ${data.map((d) => `${d.full ?? d.label} ${d.value}`).join(", ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#DADADA" strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#626262">{Number.isInteger(t) ? t : ""}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = L + i * bw + bw * 0.22;
          const w = bw * 0.56;
          const h = H - B - y(d.value);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              {d.value > 0 && <path d={`M${x},${H - B} v${-Math.max(h - 4, 0)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${Math.max(h - 4, 0)} z`} fill={hover === i ? "#191919" : "#006699"} />}
              <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#626262">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow" style={{ left: `${((L + hover * bw + bw / 2) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}>
          <div className="font-semibold">{data[hover].value}{unit}</div>
          <div className="text-white/70">{data[hover].full ?? data[hover].label}</div>
        </div>
      )}
    </div>
  );
}
