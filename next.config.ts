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
 * withPayload sends the color-scheme client hint (Accept-CH, Critical-CH,
 * Vary) on every path. Only the admin panel reads it, for its light or dark
 * theme. On the site, Critical-CH makes the browser request each first page
 * twice (about 600 ms on a phone), and Vary splits the CDN cache. So the
 * rule applies to /admin only; the other rules stay as they are.
 */
export default {
  ...withPayloadConfig,
  headers: async () =>
    (payloadHeaders ? await payloadHeaders() : []).map((rule) =>
      rule.source === "/:path*" &&
      rule.headers.some((header) => header.key === "Critical-CH")
        ? { ...rule, source: "/admin/:path*" }
        : rule,
    ),
} satisfies NextConfig;
