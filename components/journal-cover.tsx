/** Designed journal cover (used when no cover image has been uploaded). Pure SVG, scales to any size. */
export function JournalCover({ volume, issue, year, short = "IJCST", className = "" }: { volume?: number; issue?: number; year?: number; short?: string; className?: string }) {
  const nodes: [number, number][] = [[38, 132], [70, 108], [104, 140], [136, 112], [168, 150], [60, 168], [122, 178], [150, 196], [92, 204], [44, 214], [176, 226], [120, 238]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 2], [2, 6], [6, 7], [7, 4], [6, 8], [8, 9], [5, 9], [7, 10], [8, 11], [11, 10], [1, 3]];
  return (
    <svg viewBox="0 0 210 297" className={`block h-auto w-full shadow-[0_6px_18px_-6px_rgba(13,31,55,0.45)] ${className}`} role="img" aria-label={`${short} journal cover${volume ? `, volume ${volume}, issue ${issue}, ${year}` : ""}`}>
      <defs>
        <linearGradient id="jc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#191919" /><stop offset="1" stopColor="#3a3a3a" /></linearGradient>
      </defs>
      <rect width="210" height="297" fill="url(#jc-bg)" />
      <rect x="0" y="0" width="210" height="6" fill="#C8102E" />
      <text x="16" y="44" fontFamily="Georgia, 'Source Serif 4', serif" fontSize="38" fontWeight="700" fill="#ffffff" letterSpacing="1">{short}</text>
      <text x="17" y="62" fontFamily="Arial, sans-serif" fontSize="7.2" fill="#d9d9d9" letterSpacing="0.4">INTERNATIONAL JOURNAL OF</text>
      <text x="17" y="72" fontFamily="Arial, sans-serif" fontSize="7.2" fill="#d9d9d9" letterSpacing="0.4">COMPUTER SCIENCE AND TECHNOLOGY</text>
      <line x1="17" y1="84" x2="193" y2="84" stroke="#a8a8a8" strokeOpacity="0.35" />
      <g stroke="#a8a8a8" strokeOpacity="0.55" strokeWidth="0.8">
        {edges.map(([a, b], i) => <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}
      </g>
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 3.6 : 2} fill={i % 4 === 0 ? "#ffffff" : "#d9d9d9"} />)}
      <circle cx="136" cy="112" r="9" fill="none" stroke="#C8102E" strokeWidth="1" />
      <rect x="0" y="252" width="210" height="45" fill="#ffffff" />
      <text x="16" y="271" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#191919">{volume ? `Volume ${volume} · Issue ${issue}` : "Open Access Journal"}</text>
      <text x="16" y="285" fontFamily="Arial, sans-serif" fontSize="7.5" fill="#626262">{year ? `${year} · Open access` : "Peer-reviewed · Open access"}</text>
      <rect x="168" y="262" width="26" height="26" fill="#191919" />
      <text x="181" y="279" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fontWeight="700" fill="#C8102E">OA</text>
    </svg>
  );
}
