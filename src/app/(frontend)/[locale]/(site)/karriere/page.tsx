import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CareersBenefits } from "@/components/careers/CareersBenefits";
import { CareersFaq } from "@/components/careers/CareersFaq";
import { CareersIntro } from "@/components/careers/CareersIntro";
import { OpenJobs } from "@/components/careers/OpenJobs";
import { TrialDay } from "@/components/careers/TrialDay";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getHomePage, getOpenJobs, getSiteSettings } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /karriere and /en/careers. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const [t, home] = await Promise.all([
    getTranslations({ locale, namespace: "CareersPage" }),
    getHomePage(locale),
  ]);

  return {
    title: t("title"),
    // The first paragraph of the text about working here.
    description: home.careers.paragraphs[0],
    alternates: pageAlternates(locale, () => "/karriere"),
  };
}

/**
 * Careers, BRIEF.md section 2: the text about working here with a photo,
 * why it is good to work here, the open positions, the trial day for pupils
 * and frequent questions. Text, photo, reasons and questions are the
 * "Karriere" block of the home page in Payload, the positions are the
 * active jobs. The
 * application form comes in stage 4; until then the way to apply is a call.
 */
export default async function CareersPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [jobs, home, { company }] = await Promise.all([
    getOpenJobs(locale),
    getHomePage(locale),
    getSiteSettings(locale),
  ]);

  return (
    <>
      <CareersIntro
        intro={home.careers.paragraphs}
        photo={home.careers.photo}
      />
      <CareersBenefits benefits={home.careers.benefits} />
      <OpenJobs jobs={jobs} phone={company.phone} />
      <TrialDay phone={company.phone} />
      <CareersFaq faq={home.careers.faq} />
    </>
  );
}
