import { useTranslations } from "next-intl";
import type { AppHref } from "@/components/ui/AppLink";
import { AppLink } from "@/components/ui/AppLink";
import { Container } from "@/components/ui/Container";
import {
  PhotoPlaceholder,
  type PlaceholderPhoto,
} from "@/components/ui/PhotoPlaceholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export type ProjectItem = {
  id: string;
  title: string;
  /** "Einfamilienhaus, 2025, 9 Wochen" */
  meta: string;
  photo: PlaceholderPhoto;
  href: AppHref;
};

export type ProjectsContent = {
  /** The big card on the left. */
  featured: ProjectItem;
  /** The small cards stacked on the right. */
  more: ProjectItem[];
};

type ProjectCardProps = {
  item: ProjectItem;
  size: "large" | "small";
};

/** One project: photo, title and the line of facts under it; the whole card is the link. */
function ProjectCard({ item, size }: ProjectCardProps) {
  const large = size === "large";

  return (
    <AppLink
      href={item.href}
      className="group flex min-w-0 flex-col gap-4 text-graphit no-underline"
    >
      <PhotoPlaceholder
        photo={item.photo}
        className={large ? "h-80 md:h-130" : "h-52.5"}
      />
      <div>
        <h3
          className={cn(
            "font-display group-hover:text-tannengruen-dunkel group-hover:underline",
            large ? "text-h3" : "text-h4",
          )}
        >
          {item.title}
        </h3>
        <p className="mt-1.5 text-small text-schiefer">{item.meta}</p>
      </div>
    </AppLink>
  );
}

/**
 * "Ausgewählte Projekte", mockup 01e: one big project on the left and two
 * small ones stacked on the right; in one column when the row is too narrow.
 * The id "projekte" is the target of "Animation überspringen".
 */
export function Projects({ featured, more }: ProjectsContent) {
  const t = useTranslations("HomePage");

  return (
    <Section id="projekte" labelledBy="projekte-titel">
      <Container>
        <SectionHeading
          id="projekte-titel"
          title={t("projectsTitle")}
          link={{ href: "/referenzen", label: t("allProjects") }}
        />
        <div className="mt-10 flex flex-wrap gap-8">
          <div className="flex min-w-0 flex-[7_1_480px] flex-col">
            <ProjectCard item={featured} size="large" />
          </div>
          <div className="flex min-w-0 flex-[5_1_340px] flex-col gap-8">
            {more.map((item) => (
              <ProjectCard key={item.id} item={item} size="small" />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
