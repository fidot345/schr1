import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import type { ProjectCard } from "@/lib/content";
import { ProjectCards } from "../ProjectCards";
import { Section } from "../Section";

type ServiceProjectsProps = {
  projects: ProjectCard[];
};

/**
 * Projects of this type of work from "Referenzen", BRIEF.md section 2.
 * Left out while the service has none.
 */
export function ServiceProjects({ projects }: ServiceProjectsProps) {
  const t = useTranslations("ServicePage");
  if (projects.length === 0) {
    return null;
  }

  return (
    <Section id="service-projects" title={t("projectsTitle")}>
      <ProjectCards projects={projects} />
      <p>
        <TextLink href="/referenzen">{t("allProjects")}</TextLink>
      </p>
    </Section>
  );
}
