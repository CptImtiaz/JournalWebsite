import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/editor", "/reviewer", "/author", "/account", "/api/files"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
