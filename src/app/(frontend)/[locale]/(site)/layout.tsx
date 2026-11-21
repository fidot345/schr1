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
 * The shell of every page of the site, BRIEF.md section 3, with the
 * company data from SiteSettings: holiday notice (only when switched on),
 * header, the page in <main>, footer and the mobile action bar.
 * The route group adds no segment to the address.
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
  const [site, translatedSlugs] = await Promise.all([
    getSiteSettings(locale),
    getSlugTranslations(locale),
  ]);

  return (
    <>
      {site.vacation && (
        <VacationBanner from={site.vacation.from} to={site.vacation.until} />
      )}
      <Header
        brandName={site.company.logoWord}
        translatedSlugs={translatedSlugs}
      />
      <main id="main">{children}</main>
      <Footer company={site.company} openingHours={site.openingHours} />
      <MobileActionBar phone={site.company.phone} />
    </>
  );
}
