import { db } from "./db";

/** Submissions per month for the last n months (UTC). */
export async function submissionsByMonth(n = 12, where = "") {
  const rows = await db.$queryRawUnsafe<{ m: Date; c: bigint }[]>(
    `SELECT date_trunc('month', "submittedAt") AS m, count(*) AS c FROM "Manuscript" WHERE "submittedAt" >= date_trunc('month', now()) - interval '${n - 1} months' ${where} GROUP BY 1`,
  );
  const now = new Date();
  return Array.from({ length: n }, (_, k) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - k), 1));
    const r = rows.find((x) => new Date(x.m).getTime() === d.getTime());
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      full: d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
      value: Number(r?.c ?? 0),
    };
  });
}
