import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CmsImage } from "@/components/ui/CmsImage";
import type { ProjectCard as ProjectCardData } from "@/lib/content";

type ProjectCardProps = {
  project: ProjectCardData;
  /** The level of the title under the heading around the cards. */
  headingLevel: "h2" | "h3";
  /** How wide the photo is shown, for the srcset (next/image `sizes`). */
  sizes: string;
  /** The largest image above the fold: loaded first. */
  priority?: boolean;
  /** A line above the title, "Nächste Referenz". */
  label?: string;
};

/**
 * A small project card of "Ausgewählte Projekte" (01e): a 4:3 photo, the
 * title and the line of facts; the whole card is the link to the project.
 */
export function ProjectCard({
  project,
  headingLevel: Heading,
  sizes,
  priority = false,
  label,
}: ProjectCardProps) {
  const t = useTranslations("ProjectCard");

  return (
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
        sizes={sizes}
        priority={priority}
      />
      <div>
        {label ? (
          <p className="mb-1.5 text-small text-schiefer">{label}</p>
        ) : null}
        <Heading className="font-display text-h4 group-hover:text-tannengruen-dunkel group-hover:underline">
          {project.title}
        </Heading>
        <p className="mt-1.5 text-small text-schiefer">
          {t("meta", { objectType: project.objectType, year: project.year })}
        </p>
      </div>
    </AppLink>
  );
}
