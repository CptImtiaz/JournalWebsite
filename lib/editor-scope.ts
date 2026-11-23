import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "./auth";

export function manuscriptScope(u: CurrentUser): Prisma.ManuscriptWhereInput {
  if (u.permissions.has("manuscripts.view_all")) return {};
  if (u.permissions.has("manuscripts.view_assigned")) return { handlingEditorId: u.id };
  return { id: "__none__" };
}
