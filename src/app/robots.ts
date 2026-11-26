import type { MetadataRoute } from "next";
import { siteIndexing, siteUrl } from "@/lib/seo";

/*
 * /robots.txt, BRIEF.md section 5. In the demo (SITE_INDEXING not "true")
 * no crawler may read anything. With SITE_INDEXING=true the site is open
 * and the sitemap is named (its address needs NEXT_PUBLIC_SITE_URL). The
 * admin panel and Payload's API are closed in both cases.
 */
export default function robots(): MetadataRoute.Robots {
  if (!siteIndexing()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ...(base ? { sitemap: new URL("/sitemap.xml", base).href } : {}),
  };
}
