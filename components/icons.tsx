import type { SVGProps } from "react";

const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  review: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  inbox: "M4 13V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 13h4l2 3h4l2-3h4",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 10a6 6 0 0 1 12 0M16 3.5a4 4 0 0 1 0 7M21 21a6 6 0 0 0-4-5.6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7",
  layers: "m12 3 9 5-9 5-9-5zM3 13l9 5 9-5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  page: "M6 3h9l4 4v14H6zM9 9h6M9 13h6M9 17h4",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM8 8h.01",
  megaphone: "M3 10v4h4l7 4V6L7 10zM17 9a3 3 0 0 1 0 6",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  activity: "M3 12h4l3 8 4-16 3 8h4",
  check: "m5 12 5 5 9-10",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3",
  menu: "M4 6h16M4 12h16M4 18h16",
  download: "M12 4v12m0 0-4-4m4 4 4-4M4 20h16",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  rss: "M5 19h.01M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16",
  lock: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  doi: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
};
export type IconName = keyof typeof P;

export function Icon({ name, size = 18, ...p }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d={P[name]} />
    </svg>
  );
}
