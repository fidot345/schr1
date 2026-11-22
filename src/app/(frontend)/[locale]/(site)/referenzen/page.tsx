import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectList } from "@/components/projects/ProjectList";
import { RequestCta } from "@/components/sections/RequestCta";
import { pageMetadata } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getProjects, getServices } from "@/lib/content";
import { PROJECT_FILTER_PARAM, selectedService } from "@/lib/project-filter";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
 * The filter is in the address (?leistung=kuechen), so the page reads
 * searchParams and is rendered on each request instead of built ahead.
 */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "ProjectsPage" });

  return {
    title: t("title"),
    description: t("intro"),
    // Every filtered list points to the unfiltered one.
    ...(await pageMetadata(locale, () => "/referenzen")),
  };
}

/**
 * Projects, BRIEF.md section 2: the filter by service and the grid of
 * cards, then the request button.
 */
export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [projects, services, query] = await Promise.all([
    getProjects(locale),
    getServices(locale),
    searchParams,
  ]);
  const selected = selectedService(query, locale, services);
  const shown = selected
    ? projects.filter((project) => project.serviceId === selected.id)
    : projects;

  return (
    <>
      <ProjectList
        projects={shown}
        services={services}
        selected={selected?.slug ?? null}
        filterParam={PROJECT_FILTER_PARAM[locale]}
      />
      <RequestCta />
    </>
  );
}
