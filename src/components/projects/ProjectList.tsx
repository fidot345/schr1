import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type {
  ProjectCard as ProjectCardData,
  ServiceCard,
} from "@/lib/content";
import { ProjectCard } from "./ProjectCard";

type ProjectListProps = {
  /** The projects to show: all of them, or those of the chosen service. */
  projects: ProjectCardData[];
  /** The services, one filter option each. */
  services: Pick<ServiceCard, "id" | "title" | "slug">[];
  /** The slug of the chosen service, null for "Alle". */
  selected: string | null;
  /** The query parameter of the filter in this language, "leistung". */
  filterParam: string;
};

/**
 * The top of /referenzen, BRIEF.md section 2: the page title, a short
 * introduction, the filter by service and the grid of project cards.
 * The filter options are links to the same page with the service in the
 * address, so the list is filtered on the server, with or without
 * JavaScript. The chosen option is a filled button with aria-current, the
 * others are framed buttons.
 */
export function ProjectList({
  projects,
  services,
  selected,
  filterParam,
}: ProjectListProps) {
  const t = useTranslations("ProjectsPage");
  const options = [
    { key: "all", label: t("all"), href: "/referenzen" as const, slug: null },
    ...services.map((service) => ({
      key: String(service.id),
      label: service.title,
      href: {
        pathname: "/referenzen" as const,
        query: { [filterParam]: service.slug },
      },
      slug: service.slug,
    })),
  ];

  return (
    <Section
      labelledBy="referenzen-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container>
        <h1 id="referenzen-titel" className="font-display text-h1">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[34em] text-lead">{t("intro")}</p>
        <nav aria-label={t("filterLabel")} className="mt-10">
          <ul className="flex flex-wrap gap-2">
            {options.map((option) => {
              const current = option.slug === selected;
              return (
                <li key={option.key}>
                  <ButtonLink
                    href={option.href}
                    variant={current ? "primary" : "secondary"}
                    aria-current={current ? "page" : undefined}
                  >
                    {option.label}
                  </ButtonLink>
                </li>
              );
            })}
          </ul>
        </nav>
        {projects.length > 0 ? (
          <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  headingLevel="h2"
                  sizes="(min-width: 80rem) 400px, (min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
                  // On the phone the first photo is the largest element on screen.
                  priority={index === 0}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12">{t("empty")}</p>
        )}
      </Container>
    </Section>
  );
}
