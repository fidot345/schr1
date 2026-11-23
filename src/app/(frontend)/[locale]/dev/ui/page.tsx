import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/content";

/*
 * /dev/ui and /en/dev/ui: the component overview, BRIEF.md sections 3 and 6.
 *
 * The route is not in routing.pathnames: it is not a page of the site.
 * next-intl's proxy passes unknown paths through, with the same
 * prefix rules (German without prefix, English under /en).
 *
 * Only in `next dev`. In a production build NODE_ENV is "production",
 * the branch below falls away, and the showcase is not even imported:
 * the page is a 404. Phone and opening hours come from SiteSettings.
 */

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (process.env.NODE_ENV !== "development") {
    return {};
  }
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DevUi" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function DevUiPage({ params }: PageProps) {
  if (process.env.NODE_ENV === "development") {
    const { locale } = await params;
    setRequestLocale(locale);
    const [{ DevUiShowcase }, { company, openingHours }] = await Promise.all([
      import("./DevUiShowcase"),
      getSiteSettings(locale),
    ]);
    return <DevUiShowcase company={company} openingHours={openingHours} />;
  }
  notFound();
}
