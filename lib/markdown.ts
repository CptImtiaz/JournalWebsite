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
