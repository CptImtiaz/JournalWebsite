import { cache } from "react";
import { db } from "./db";

export const getPage = cache(async (slug: string) => db.page.findUnique({ where: { slug } }));
