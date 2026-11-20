import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Zilla_Slab } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { routing } from "@/i18n/routing";
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
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    // Absolute URLs for alternates and previews; unset when the variable is.
    metadataBase:
      siteUrl && URL.canParse(siteUrl) ? new URL(siteUrl) : undefined,
    title: {
      default: t("title"),
      template: t("template"),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "SkipLink" });

  /*
   * <body> holds the skip link and then the page shell: VacationBanner,
   * Header, <main id="main">, Footer, MobileActionBar, in that order and as
   * direct children (sticky works only inside the parent). The shell comes
   * from (site)/layout.tsx; /dev/ui brings its own with demo data.
   */
  return (
    <html
      lang={locale}
      className={`${zillaSlab.variable} ${atkinson.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-weiss focus:px-6 focus:py-3 focus:font-bold focus:text-tannengruen focus:underline focus:underline-offset-4"
        >
          {t("label")}
        </a>
        <NextIntlClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
