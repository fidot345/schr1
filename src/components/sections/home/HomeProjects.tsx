import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import type { ProjectCard } from "@/lib/content";
import { ProjectCards } from "../ProjectCards";
import { Section } from "../Section";

type HomeProjectsProps = {
  projects: ProjectCard[];
};

/** "Ausgewählte Projekte": the three chosen in the admin panel, BRIEF.md section 2. */
export function HomeProjects({ projects }: HomeProjectsProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-projects" title={t("projectsTitle")}>
      <ProjectCards projects={projects} />
      <p>
        <TextLink href="/referenzen">{t("allProjects")}</TextLink>
      </p>
    </Section>
  );
}
