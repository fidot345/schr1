import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import type { ProjectCard } from "@/lib/content";
import { Card } from "../Card";
import { Section } from "../Section";

type HomeProjectsProps = {
  projects: ProjectCard[];
};

/** "Ausgewählte Projekte": the three chosen in the admin panel, BRIEF.md section 2. */
export function HomeProjects({ projects }: HomeProjectsProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-projects" title={t("projectsTitle")}>
      <ul className="grid gap-12 md:grid-cols-3 md:gap-8">
        {projects.map((project) => (
          <li key={project.id}>
            <Card
              href={{
                pathname: "/referenzen/[slug]",
                params: { slug: project.slug },
              }}
              photo={project.photo}
              title={project.title}
              // The year as a string: as a number ICU would write "2.024".
              line={t("projectMeta", {
                objectType: project.objectType,
                year: String(project.year),
              })}
              sizes="(min-width: 80rem) 390px, (min-width: 48rem) 33vw, 100vw"
            />
          </li>
        ))}
      </ul>
      <p>
        <TextLink href="/referenzen">{t("allProjects")}</TextLink>
      </p>
    </Section>
  );
}
