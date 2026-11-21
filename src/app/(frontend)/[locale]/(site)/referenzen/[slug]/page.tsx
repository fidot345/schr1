import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectIntro } from "@/components/projects/ProjectIntro";
import { ProjectNeighbors } from "@/components/projects/ProjectNeighbors";
import { ProjectStory } from "@/components/projects/ProjectStory";
import { RequestCta } from "@/components/sections/RequestCta";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getProject, getProjects } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Every project in both languages, with the slug of that language:
 * /referenzen/wohnkueche-in-eiche and /en/projects/open-plan-kitchen-in-oak.
 * A project added later is built on its first visit; an unknown slug
 * gives 404.
 */
export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) {
    return [];
  }
  const projects = await getProjects(locale);
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const project = await getProject(locale, slug);
  if (!project) {
    // The 404 title of not-found.tsx, also once the browser has the page.
    notFound();
  }

  return {
    // An SEO title from the admin panel names the company itself, as on the
    // home page; otherwise the project title goes through the template.
    title: project.meta.title
      ? { absolute: project.meta.title }
      : project.title,
    // Without one from the admin panel, the first paragraph of the task.
    description: project.meta.description ?? project.challenge[0],
    alternates: pageAlternates(locale, (code) => ({
      pathname: "/referenzen/[slug]",
      params: { slug: project.slugs[code] },
    })),
  };
}

/**
 * A project, BRIEF.md section 2: the title with the facts and the cover,
 * "Die Aufgabe" and "Unsere Lösung", the photos, the projects before and
 * after it and the request button.
 */
export default async function ProjectPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [project, t] = await Promise.all([
    getProject(locale, slug),
    getTranslations({ locale, namespace: "ProjectPage" }),
  ]);
  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectIntro
        title={project.title}
        facts={project.facts}
        service={project.service}
        photo={project.photo}
      />
      <ProjectStory challenge={project.challenge} solution={project.solution} />
      <ServiceGallery photos={project.gallery} />
      <ProjectNeighbors previous={project.previous} next={project.next} />
      <RequestCta link={{ href: "/referenzen", label: t("allProjects") }} />
    </>
  );
}
