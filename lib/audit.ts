import { headers } from "next/headers";
import { db } from "./db";

export async function audit(actorId: string | null | undefined, action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {}
  await db.auditLog.create({
    data: { actorId: actorId ?? null, action, entityType, entityId, details: (details as object) ?? undefined, ip },
  });
}
