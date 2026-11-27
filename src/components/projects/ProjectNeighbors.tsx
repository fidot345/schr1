import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProjectCard as ProjectCardData } from "@/lib/content";
import { ProjectCard } from "./ProjectCard";

type ProjectNeighborsProps = {
  previous: ProjectCardData | null;
  next: ProjectCardData | null;
};

const SIZES = "(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 100vw";

/**
 * "zurück / weiter", BRIEF.md section 2: the projects before and after
 * this one in the admin panel's order, as small project cards. From md the
 * previous one is on the left and the next one on the right. The first and
 * the last project have one neighbour: its card stands in the middle, as
 * wide as in a pair, so no empty cell is left beside it. Four columns with
 * two per card make that middle. No section when the project is the only
 * one.
 */
export function ProjectNeighbors({ previous, next }: ProjectNeighborsProps) {
  const t = useTranslations("ProjectPage");
  if (!previous && !next) {
    return null;
  }
  const card =
    previous && next ? "md:col-span-2" : "md:col-span-2 md:col-start-2";

  return (
    <Section labelledBy="weitere-titel">
      <Container>
        <SectionHeading id="weitere-titel" title={t("moreTitle")} />
        <ul className="mt-10 grid gap-8 md:grid-cols-4">
          {previous ? (
            <li className={card}>
              <ProjectCard
                project={previous}
                headingLevel="h3"
                sizes={SIZES}
                label={t("previous")}
              />
            </li>
          ) : null}
          {next ? (
            <li className={card}>
              <ProjectCard
                project={next}
                headingLevel="h3"
                sizes={SIZES}
                label={t("next")}
              />
            </li>
          ) : null}
        </ul>
      </Container>
    </Section>
  );
}
