import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutIntro } from "@/components/about/AboutIntro";
import { AboutPrinciples } from "@/components/about/AboutPrinciples";
import { TeamList } from "@/components/about/TeamList";
import { RequestCta } from "@/components/sections/RequestCta";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getHomePage, getTeam } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /ueber-uns and /en/about. */
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
    getTranslations({ locale, namespace: "AboutPage" }),
    getHomePage(locale),
  ]);

  return {
    title: t("title"),
    // The first paragraph of the story.
    description: home.about.paragraphs[0],
    alternates: pageAlternates(locale, () => "/ueber-uns"),
  };
}

/**
 * About us, BRIEF.md section 2: the story with the mark "Meisterbetrieb"
 * and a photo of the workshop, the principles of the work, then the team.
 * Story, photo and principles are the "Über uns" block of the home page in
 * Payload, the team is the Team collection.
 */
export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [home, team, t] = await Promise.all([
    getHomePage(locale),
    getTeam(locale),
    getTranslations({ locale, namespace: "HomePage" }),
  ]);

  return (
    <>
      <AboutIntro
        title={home.about.title}
        story={home.about.paragraphs}
        photo={home.about.photo}
      />
      <AboutPrinciples principles={home.about.principles} />
      <TeamList team={team} />
      <RequestCta link={{ href: "/karriere", label: t("openJobsCta") }} />
    </>
  );
}
