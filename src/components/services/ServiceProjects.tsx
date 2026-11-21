import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProjectCard } from "@/lib/content";

type ServiceProjectsProps = {
  projects: ProjectCard[];
};

/**
 * Projects of this service from "Referenzen", BRIEF.md section 2. The
 * cards are the small ones of "Ausgewählte Projekte" (01e): a photo, the
 * title and the line of facts; the whole card is the link. Up to three in
 * a row. No section when the service has no projects yet.
 */
export function ServiceProjects({ projects }: ServiceProjectsProps) {
  const t = useTranslations("ServicePage");
  const tCard = useTranslations("ProjectCard");
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
              <AppLink
                href={{
                  pathname: "/referenzen/[slug]",
                  params: { slug: project.slug },
                }}
                className="group flex flex-col gap-4 text-graphit no-underline"
              >
                <CmsImage
                  photo={project.photo}
                  frameClassName="aspect-4/3"
                  sizes="(min-width: 80rem) 400px, (min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
                />
                <div>
                  <h3 className="font-display text-h4 group-hover:text-tannengruen-dunkel group-hover:underline">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 text-small text-schiefer">
                    {tCard("meta", {
                      objectType: project.objectType,
                      year: project.year,
                    })}
                  </p>
                </div>
              </AppLink>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
