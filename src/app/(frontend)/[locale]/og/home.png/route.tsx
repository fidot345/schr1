import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { homePreview } from "@/lib/preview";
import { previewImageResponse } from "@/lib/preview-image";

/*
 * The home page's preview image, /de/og/home.png and /en/og/home.png:
 * the title and the text of the first screen (src/lib/preview.ts). Drawn
 * when the site is built and again after a save in the admin panel.
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

  const { content } = await homePreview(locale);
  return previewImageResponse(content);
}
