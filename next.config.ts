import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    // BRIEF.md section 3: AVIF first (smaller), WebP for browsers without it.
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/api/media/file/**",
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(dirname),
  },
};

const withPayloadConfig = withPayload(withNextIntl(nextConfig), {
  devBundleServerPackages: false,
});

const payloadHeaders = withPayloadConfig.headers;

/*
 * The demo keeps search engines out, AGENTS.md "Демо-режим": unless
 * SITE_INDEXING is "true", every response says noindex, nofollow, as the
 * robots meta tag of the pages does (src/lib/seo.ts reads the variable the
 * same way). Read at build time, like the pages built ahead.
 */
const noindexHeaders =
  process.env.SITE_INDEXING?.trim() === "true"
    ? []
    : [
        {
          source: "/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ];

/*
 * Security headers, BRIEF.md section 5 "Безопасность и приватность", on
 * every path. The browser may load and send things to our own domain only:
 * photos come through /_next/image and /api/media/file (Payload streams
 * them from Vercel Blob on the server, uploads go through the server too),
 * so no other host is allowed. The admin panel works under the same policy
 * (its Gravatar pictures are off in payload.config.ts); /_next/image keeps
 * the stricter policy Next.js gives it.
 *
 * 'unsafe-inline' in script-src: the pages are built ahead and updated from
 * the admin panel, and Next.js writes the data of each page into inline
 * scripts (self.__next_f.push). A nonce works only when every page is
 * rendered per request; hashes would differ per page and per build. So the
 * brief keeps 'unsafe-inline' and the static pages.
 * 'unsafe-inline' in style-src: style attributes in the HTML, such as the
 * photo position from the admin panel and those of next/image.
 * 'unsafe-eval' in development only: React rebuilds server error stacks
 * with eval there. The production build has no eval.
 */
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = (directives: Record<string, string>) =>
  Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources}`)
    .join("; ");

const policy = {
  "default-src": "'self'",
  "script-src": `'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: blob:",
  "font-src": "'self'",
  "connect-src": "'self'",
  "object-src": "'none'",
  "frame-ancestors": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
};

const securityHeaders = [
  {
    source: "/:path*",
    headers: [
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy(policy),
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "X-Frame-Options", value: "DENY" },
    ],
  },
  /*
   * Cross-Origin-Opener-Policy on the admin panel only, where the login
   * cookie lives. With COOP of any value, Lighthouse 13.6 (Chrome 158/159)
   * cannot read the trace of the page load and gives no performance score
   * (NO_NAVSTART), and BRIEF.md section 7 measures every page with it. The
   * public pages have no cookie and open no windows, so COOP protects
   * nothing there.
   */
  {
    source: "/admin/:path*",
    headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin" }],
  },
];

/*
 * withPayload sends the color-scheme client hint (Accept-CH, Critical-CH,
 * Vary) on every path. Only the admin panel reads it, for its light or dark
 * theme. On the site, Critical-CH makes the browser request each first page
 * twice (about 600 ms on a phone), and Vary splits the CDN cache. So the
 * rule applies to /admin only; the other rules stay as they are.
 */
export default {
  ...withPayloadConfig,
  headers: async () => [
    ...(payloadHeaders ? await payloadHeaders() : []).map((rule) =>
      rule.source === "/:path*" &&
      rule.headers.some((header) => header.key === "Critical-CH")
        ? { ...rule, source: "/admin/:path*" }
        : rule,
    ),
    ...noindexHeaders,
    ...securityHeaders,
  ],
} satisfies NextConfig;
