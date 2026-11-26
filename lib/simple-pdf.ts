/** Minimal single/multi-page text PDF generator (Helvetica), used for sample article PDFs. */
function esc(s: string) {
  return s.replace(/[^\x20-\x7E]/g, (c) => ({ "–": "-", "—": "-", "’": "'", "‘": "'", "“": '"', "”": '"', "é": "e", "ö": "o", "ü": "u", "ç": "c" })[c] ?? "?").replace(/([\\()])/g, "\\$1");
}
function wrap(text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      if ((line + " " + w).trim().length > max) { out.push(line.trim()); line = w; } else line += " " + w;
    }
    out.push(line.trim());
  }
  return out;
}

export type PdfBlock = { text: string; size?: number; bold?: boolean; gap?: number };

export function buildPdf(blocks: PdfBlock[], footer: string): Buffer {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = 770;
  const flush = () => { ops.push(`BT /F1 8 Tf 50 30 Td (${esc(footer)}) Tj ET`); pages.push(ops.join("\n")); ops = []; y = 770; };
  for (const b of blocks) {
    const size = b.size ?? 10;
    const lines = wrap(b.text, Math.floor(980 / size));
    y -= b.gap ?? 6;
    for (const l of lines) {
      if (y < 60) flush();
      ops.push(`BT /${b.bold ? "F2" : "F1"} ${size} Tf 50 ${y} Td (${esc(l)}) Tj ET`);
      y -= size * 1.4;
    }
  }
  flush();
  const objs: string[] = [];
  const add = (s: string) => objs.push(s) ;
  add("<< /Type /Catalog /Pages 2 0 R >>");
  const pageIds = pages.map((_, i) => 5 + i * 2);
  add(`<< /Type /Pages /Kids [${pageIds.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  pages.forEach((content, i) => {
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
    add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}
