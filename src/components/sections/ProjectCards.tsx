import { useTranslations } from "next-intl";
import type { ProjectCard } from "@/lib/content";
import { Card } from "./Card";

type ProjectCardsProps = {
  projects: ProjectCard[];
};

/** Project cards in three columns from md: photo, title, object and year. */
export function ProjectCards({ projects }: ProjectCardsProps) {
  const t = useTranslations("ProjectCard");

  return (
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
            line={t("meta", {
              objectType: project.objectType,
              year: String(project.year),
            })}
            sizes="(min-width: 80rem) 390px, (min-width: 48rem) 33vw, 100vw"
          />
        </li>
      ))}
    </ul>
  );
}
