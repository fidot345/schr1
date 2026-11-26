import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { sitePreview } from "@/lib/preview";
import { previewImageResponse } from "@/lib/preview-image";

/*
 * The site's preview image, /de/og/site.png and /en/og/site.png: the
 * og:image of every page without its own (src/lib/preview.ts). Drawn when
 * the site is built and again after a save in the admin panel.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type RouteProps = {
  params: Promise<{ locale: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteProps,
): Promise<Response> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }

  const { content } = await sitePreview(locale);
  return previewImageResponse(content);
}
