import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import type { FeaturedProject } from "@/lib/content";

type ProjectsProps = {
  /** The projects chosen in the admin panel; the first one is the big card. */
  projects: FeaturedProject[];
};

type ProjectCardProps = {
  project: FeaturedProject;
  size: "large" | "small";
};

/** One project: photo, title and the line of facts under it; the whole card is the link. */
function ProjectCard({ project, size }: ProjectCardProps) {
  const t = useTranslations("HomePage");
  const large = size === "large";

  return (
    <AppLink
      href={{ pathname: "/referenzen/[slug]", params: { slug: project.slug } }}
      className="group flex min-w-0 flex-col gap-4 text-graphit no-underline"
    >
      <CmsImage
        photo={project.photo}
        frameClassName={large ? "h-80 md:h-130" : "h-52.5"}
        sizes={
          large
            ? "(min-width: 80rem) 700px, (min-width: 64rem) 58vw, 100vw"
            : "(min-width: 80rem) 500px, (min-width: 64rem) 42vw, 100vw"
        }
      />
      <div>
        <h3
          className={cn(
            "font-display group-hover:text-tannengruen-dunkel group-hover:underline",
            large ? "text-h3" : "text-h4",
          )}
        >
          {project.title}
        </h3>
        <p className="mt-1.5 text-small text-schiefer">
          {t("projectMeta", {
            objectType: project.objectType,
            year: String(project.year),
            duration: project.duration,
          })}
        </p>
      </div>
    </AppLink>
  );
}

/**
 * "Ausgewählte Projekte", mockup 01e: one big project on the left and two
 * small ones stacked on the right; in one column when the row is too narrow.
 * The id "projekte" is the target of "Animation überspringen", so the
 * section stays even without projects.
 */
export function Projects({ projects }: ProjectsProps) {
  const t = useTranslations("HomePage");
  const [featured, ...more] = projects;

  return (
    <Section id="projekte" labelledBy="projekte-titel">
      <Container>
        <SectionHeading
          id="projekte-titel"
          title={t("projectsTitle")}
          link={{ href: "/referenzen", label: t("allProjects") }}
        />
        {featured ? (
          <div className="mt-10 flex flex-wrap gap-8">
            <div className="flex min-w-0 flex-[7_1_480px] flex-col">
              <ProjectCard project={featured} size="large" />
            </div>
            <div className="flex min-w-0 flex-[5_1_340px] flex-col gap-8">
              {more.map((project) => (
                <ProjectCard key={project.id} project={project} size="small" />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
