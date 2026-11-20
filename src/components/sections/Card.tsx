import { CmsImage } from "@/components/ui/CmsImage";
import { Heading } from "@/components/ui/Heading";
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
};

/**
 * Service or project card, BRIEF.md section 3: photo 4:3, title, one line.
 * No border, no shadow, no hover animation; the whole card is one link,
 * and the title is underlined while the pointer is on it.
 */
export function Card({ href, photo, title, line, sizes }: CardProps) {
  return (
    <Link href={href} className="group flex h-full flex-col gap-4 rounded">
      <CmsImage photo={photo} frameClassName="aspect-4/3" sizes={sizes} />
      <div className="flex flex-col gap-2">
        <Heading
          level={3}
          size={4}
          className="text-graphit underline-offset-4 group-hover:text-tannengruen group-hover:underline"
        >
          {title}
        </Heading>
        <p className="text-schiefer">{line}</p>
      </div>
    </Link>
  );
}
