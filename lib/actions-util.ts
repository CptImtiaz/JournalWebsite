import { redirect } from "next/navigation";

export function back(path: string, msg: { ok?: string; error?: string }): never {
  const u = new URL(path, "http://x");
  u.searchParams.delete("ok");
  u.searchParams.delete("error");
  if (msg.ok) u.searchParams.set("ok", msg.ok);
  if (msg.error) u.searchParams.set("error", msg.error);
  redirect(u.pathname + u.search + u.hash);
}
