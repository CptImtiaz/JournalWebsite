import "server-only";
import { db } from "./db";

type Model = "editorialBoardMember" | "researchCategory" | "page" | "article";

/** Move an item one step up/down within its ordered group by renumbering the group. */
export async function moveItem(model: Model, id: string, dir: -1 | 1, groupWhere: Record<string, unknown> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (db as any)[model];
  const items: { id: string }[] = await m.findMany({ where: groupWhere, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = items.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  await db.$transaction(items.map((x, k) => m.update({ where: { id: x.id }, data: { sortOrder: k } })));
}
