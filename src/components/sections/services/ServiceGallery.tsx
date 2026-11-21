import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Photo } from "@/lib/media";
import { Section } from "../Section";

type ServiceGalleryProps = {
  photos: Photo[];
};

/**
 * Photos of the service, BRIEF.md section 3: in their own proportions, not
 * cropped, two columns from md. Below the fold, so they load lazily.
 */
export function ServiceGallery({ photos }: ServiceGalleryProps) {
  const t = useTranslations("ServicePage");
  if (photos.length === 0) {
    return null;
  }

  return (
    <Section id="service-gallery" title={t("galleryTitle")}>
      <ul className="grid items-start gap-8 md:grid-cols-2">
        {photos.map((photo) => (
          <li key={photo.src}>
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 100vw"
              loading="lazy"
              className="h-auto w-full rounded bg-moos"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
