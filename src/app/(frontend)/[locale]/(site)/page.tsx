import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { Jobs } from "@/components/home/Jobs";
import { Process } from "@/components/home/Process";
import { Projects } from "@/components/home/Projects";
import { Services } from "@/components/home/Services";
import { Testimonials } from "@/components/home/Testimonials";
import { WardrobeSection } from "@/components/home/WardrobeSection";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import {
  getContactDetails,
  getHomePage,
  getOpenJobs,
  getServices,
  getTestimonials,
} from "@/lib/content";

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

/** "Was Kunden sagen" shows three, BRIEF.md section 2. */
const TESTIMONIALS = 3;

/**
 * The home page, from the mockup in design/: the sections in the order of
 * design/README.md. Texts and photos come from Payload (the HomePage global,
 * services, open jobs, testimonials and SiteSettings); headings, buttons
 * and the short intros of the sections from messages.
 */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const [home, services, jobs, testimonials, contact, t] = await Promise.all([
    getHomePage(locale),
    getServices(locale),
    getOpenJobs(locale),
    getTestimonials(locale, TESTIMONIALS),
    getContactDetails(locale),
    getTranslations({ locale, namespace: "HomePage" }),
  ]);
  const { about, careers } = home;

  return (
    <>
      <Hero {...home.hero} />
      <Services services={services} />
      {/* TEMP(stage-5): the step is fixed until the 3D scene sets it. */}
      <WardrobeSection steps={home.sceneSteps} activeStep={3} />
      <Projects projects={home.featuredProjects} />
      <Process steps={home.processSteps} note={t("processNote")} />
      <Jobs
        title={careers.title}
        paragraphs={careers.paragraphs}
        photo={careers.photo}
        jobs={jobs}
      />
      <AboutTeaser
        title={about.title}
        paragraphs={about.paragraphs}
        photo={about.photo}
      />
      <Testimonials testimonials={testimonials} />
      <Contact
        company={contact.company}
        openingHours={contact.openingHours}
        serviceArea={contact.serviceArea}
      />
    </>
  );
}
