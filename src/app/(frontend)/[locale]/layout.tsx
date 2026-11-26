import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Zilla_Slab } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { routing } from "@/i18n/routing";
import { robotsMetadata, siteUrl } from "@/lib/seo";
import "../globals.css";

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-zilla-slab",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
  // No metrics for this family in next/font; the fallback face is in globals.css.
  adjustFontFallback: false,
});

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  // For the metadata of (site)/not-found.tsx, which gets no params: it
  // awaits this metadata and then reads the locale set here.
  if (!hasLocale(routing.locales, locale)) {
    // A path that is no language, such as /humans.txt (the proxy skips
    // file names), is a 404 too. Without a locale here, next-intl would
    // read the request headers, and the page built ahead fails with 500.
    setRequestLocale(routing.defaultLocale);
    return { robots: robotsMetadata() };
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    // Absolute URLs for alternates and previews; unset when the variable is.
    metadataBase: siteUrl() ?? undefined,
    title: {
      default: t("title"),
      template: t("template"),
    },
    // noindex, nofollow on every page of the demo, SITE_INDEXING.
    robots: robotsMetadata(),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  /*
   * <body> holds the skip link and then the page shell: VacationBanner,
   * Header, <main id="main">, Footer, MobileActionBar, in that order and as
   * direct children (sticky works only inside the parent). The shell comes
   * from (site)/layout.tsx; /dev/ui has none of it. The body is a column at
   * least as tall as the screen, so the mobile bar stays at the bottom of
   * the screen on a short page too (main grows, see (site)/layout.tsx).
   */
  return (
    <html
      lang={locale}
      className={`${zillaSlab.variable} ${atkinson.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <NextIntlClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
