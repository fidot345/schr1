import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { Projects } from "@/components/home/Projects";
import { Services } from "@/components/home/Services";
import { WardrobeSection } from "@/components/home/WardrobeSection";
import { getDemoHome } from "@/content/demo-home";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getHomePage } from "@/lib/content";

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

/**
 * The home page, from the mockup in design/ (redesign sessions 4 and 5):
 * the sections in the order of design/README.md. The data comes from
 * src/content/demo-home.ts until the pages read from Payload again.
 */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const { hero, services, scene, projects } = getDemoHome(locale);

  return (
    <>
      <Hero {...hero} />
      <Services {...services} />
      {/* TEMP(stage-5): the step is fixed until the 3D scene sets it. */}
      <WardrobeSection {...scene} activeStep={3} />
      <Projects {...projects} />
    </>
  );
}
