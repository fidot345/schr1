import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Photo } from "@/lib/media";

type CmsImageProps = {
  /** From toPhoto(); null shows an empty Moos surface of the same size. */
  photo: Photo | null;
  /** Aspect ratio and rounding of the frame, for example "aspect-4/3". */
  frameClassName: string;
  /** How wide the image is shown, for the srcset (next/image `sizes`). */
  sizes: string;
  /** The largest image above the fold (LCP): loaded first, not lazily. */
  priority?: boolean;
};

/**
 * A photo from Payload's Media collection, BRIEF.md section 3: cropped to
 * the frame around the focal point set in the admin panel, resized and
 * converted (AVIF, WebP) by next/image on our own domain.
 */
export function CmsImage({
  photo,
  frameClassName,
  sizes,
  priority = false,
}: CmsImageProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded bg-moos", frameClassName)}
    >
      {photo && (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover"
          style={{ objectPosition: photo.position }}
        />
      )}
    </div>
  );
}
