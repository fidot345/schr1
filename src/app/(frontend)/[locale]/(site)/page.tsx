import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HomeAbout } from "@/components/sections/home/HomeAbout";
import { HomeCareers } from "@/components/sections/home/HomeCareers";
import { HomeContact } from "@/components/sections/home/HomeContact";
import { HomeHero } from "@/components/sections/home/HomeHero";
import { HomeProjects } from "@/components/sections/home/HomeProjects";
import { HomeScene } from "@/components/sections/home/HomeScene";
import { HomeServices } from "@/components/sections/home/HomeServices";
import { HomeTestimonials } from "@/components/sections/home/HomeTestimonials";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import {
  getHomePage,
  getOpenJobs,
  getServices,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

/** "Kundenstimmen" shows three quotes, BRIEF.md section 2. */
const TESTIMONIALS = 3;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: / and /en. */
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
  const { hero, meta } = await getHomePage(locale);

  return {
    // The SEO title from the admin panel already names the company, so it
    // skips the "| Schreinerei Tannrieder" template; without it, the hero
    // title goes through the template.
    title: meta.title ? { absolute: meta.title } : hero.title,
    description: meta.description ?? hero.text,
    alternates: pageAlternates(locale, () => "/"),
  };
}

/** Home page, blocks from top to bottom as in BRIEF.md section 2. */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [home, services, jobs, testimonials, site] = await Promise.all([
    getHomePage(locale),
    getServices(locale),
    getOpenJobs(locale),
    getTestimonials(locale, TESTIMONIALS),
    getSiteSettings(locale),
  ]);

  return (
    <div className="flex flex-col gap-section-large">
      <HomeHero hero={home.hero} />
      <HomeServices services={services} />
      <HomeScene captions={home.sceneCaptions} />
      <HomeProjects projects={home.featuredProjects} />
      <ProcessSection id="home-process" steps={home.processSteps} />
      <HomeCareers block={home.careers} jobs={jobs} />
      <HomeAbout block={home.about} />
      <HomeTestimonials testimonials={testimonials} />
      <HomeContact site={site} />
    </div>
  );
}
