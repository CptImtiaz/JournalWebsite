import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "figure", "figcaption", "sup", "sub", "table", "thead", "tbody", "tr", "th", "td", "caption"]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "id"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["id", "class"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
};

export function sanitize(html: string) {
  return sanitizeHtml(html, SANITIZE);
}

export function renderMarkdown(md: string) {
  return sanitize(marked.parse(md ?? "", { async: false, gfm: true }) as string);
}

export function stripHtml(s: string) {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });
}

/** Adds stable ids to h2 headings so the article page can link to sections. */
export function withHeadingIds(html: string) {
  const seen = new Map<string, number>();
  return html.replace(/<h2>(.*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "");
    let id = "sec-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id += "-" + n;
    return `<h2 id="${id}">${inner}</h2>`;
  });
}

export function headingsOf(html: string) {
  return [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({ id: m[1], label: m[2].replace(/<[^>]+>/g, "") }));
}
