"use server";
import { requirePermission } from "@/lib/auth";
import { loadSampleContent, removeSampleContent } from "@/lib/sample-content";
import { back } from "@/lib/actions-util";

export async function loadSampleAction() {
  const u = await requirePermission("publishing.manage");
  const r = await loadSampleContent(u.id);
  back("/admin", r.created ? { ok: `${r.created} sample articles, a sample issue and 2 announcements were added.` } : { error: "Sample content is already loaded." });
}

export async function removeSampleAction() {
  const u = await requirePermission("publishing.manage");
  const r = await removeSampleContent(u.id);
  back("/admin", { ok: `Removed ${r.removed} sample articles and all other sample content.` });
}
