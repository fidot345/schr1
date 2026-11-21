import { useTranslations } from "next-intl";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProjectCard as ProjectCardData } from "@/lib/content";

type ServiceProjectsProps = {
  projects: ProjectCardData[];
};

/**
 * Projects of this service from "Referenzen", BRIEF.md section 2. The
 * cards are the small ones of "Ausgewählte Projekte" (01e): a photo, the
 * title and the line of facts; the whole card is the link. Up to three in
 * a row. No section when the service has no projects yet.
 */
export function ServiceProjects({ projects }: ServiceProjectsProps) {
  const t = useTranslations("ServicePage");
  if (projects.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="referenzen-titel">
      <Container>
        <SectionHeading
          id="referenzen-titel"
          title={t("projectsTitle")}
          link={{ href: "/referenzen", label: t("allProjects") }}
        />
        <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                headingLevel="h3"
                sizes="(min-width: 80rem) 400px, (min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
