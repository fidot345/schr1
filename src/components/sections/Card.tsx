import { CmsImage } from "@/components/ui/CmsImage";
import { Heading, type HeadingLevel } from "@/components/ui/Heading";
import type { InternalHref } from "@/components/ui/TextLink";
import { Link } from "@/i18n/navigation";
import type { Photo } from "@/lib/media";

type CardProps = {
  href: InternalHref;
  photo: Photo | null;
  title: string;
  /** The one line under the title. */
  line: string;
  /** next/image `sizes` for the grid the card sits in. */
  sizes: string;
  /** h3 under a section's h2; h2 where the cards are the page's main list. */
  headingLevel?: 2 | 3;
  /** Visual size of the title, h4 by default. */
  headingSize?: HeadingLevel;
  /** The first card when it is the page's largest element above the fold. */
  priority?: boolean;
};

/**
 * Service or project card, BRIEF.md section 3: photo 4:3, title, one line.
 * No border, no shadow, no hover animation; the whole card is one link,
 * and the title is underlined while the pointer is on it.
 */
export function Card({
  href,
  photo,
  title,
  line,
  sizes,
  headingLevel = 3,
  headingSize = 4,
  priority = false,
}: CardProps) {
  return (
    <Link href={href} className="group flex h-full flex-col gap-4 rounded">
      <CmsImage
        photo={photo}
        frameClassName="aspect-4/3"
        sizes={sizes}
        priority={priority}
      />
      <div className="flex flex-col gap-2">
        <Heading
          level={headingLevel}
          size={headingSize}
          className="text-graphit underline-offset-4 group-hover:text-tannengruen group-hover:underline"
        >
          {title}
        </Heading>
        <p className="text-schiefer">{line}</p>
      </div>
    </Link>
  );
}
