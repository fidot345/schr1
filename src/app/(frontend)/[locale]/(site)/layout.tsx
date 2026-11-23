import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { routing } from "@/i18n/routing";
import { getSiteSettings, getSlugTranslations } from "@/lib/content";

type SiteLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * The shell of every page of the site, docs/REDESIGN.md, session 3:
 * holiday notice (only when switched on), header, the page in <main>,
 * footer and the mobile bar. They are direct children of <body>, in this
 * order. The route group adds no segment to the address. Company data,
 * opening hours, the footer line and the holiday come from SiteSettings in
 * Payload. The language
 * switch in the header gets the translated slugs of the service pages from
 * Payload, so /leistungen/kuechen switches to /en/services/kitchens.
 */
export default async function SiteLayout({
  children,
  params,
}: SiteLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const [{ company, openingHours, tagline, vacation }, translatedSlugs] =
    await Promise.all([getSiteSettings(locale), getSlugTranslations(locale)]);

  return (
    <>
      <VacationBanner
        enabled={vacation !== null}
        from={vacation?.from}
        to={vacation?.until}
      />
      <Header
        companyName={company.name}
        brandName={company.logoWord}
        translatedSlugs={translatedSlugs}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer company={company} openingHours={openingHours} tagline={tagline} />
      <MobileActionBar phone={company.phone} />
    </>
  );
}
