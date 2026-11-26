import type { Metadata } from "next";

/*
 * Search engines and the demo, BRIEF.md sections 5 and 7. The workshop is
 * fictional, so by default no search engine may crawl or index the site:
 * every page says noindex, nofollow (here and in the X-Robots-Tag header
 * of next.config.ts) and robots.txt disallows everything. Only
 * SITE_INDEXING=true lets them in, for a local Lighthouse run or a real
 * launch later.
 */

/** true only for SITE_INDEXING=true; empty, missing or anything else is the demo. */
export const siteIndexing = (): boolean =>
  process.env.SITE_INDEXING?.trim() === "true";

/** The robots meta tag of the demo. */
const DEMO_ROBOTS = { index: false, follow: false } as const;

/**
 * The robots metadata of a page: `own` (none means index, follow) while
 * search engines are let in, noindex, nofollow in the demo. The layout
 * sets it for every page; a page with its own rule, such as a thank-you
 * page, passes that rule here so the demo still wins.
 */
export const robotsMetadata = (own?: Metadata["robots"]): Metadata["robots"] =>
  siteIndexing() ? own : DEMO_ROBOTS;

/** The site's address from NEXT_PUBLIC_SITE_URL; null when unset or no URL. */
export const siteUrl = (): URL | null => {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  return value && URL.canParse(value) ? new URL(value) : null;
};

/**
 * An absolute URL for a path of the site, as the sitemap, robots.txt and
 * the Google markup need them. Without NEXT_PUBLIC_SITE_URL the path stays
 * relative: it still works on the page itself, and nothing is made up.
 */
export const absoluteUrl = (path: string): string => {
  const base = siteUrl();
  return base ? new URL(path, base).href : path;
};
