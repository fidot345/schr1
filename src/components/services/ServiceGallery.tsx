import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Photo } from "@/lib/media";

type ServiceGalleryProps = {
  photos: Photo[];
};

/**
 * The photos of a service, BRIEF.md section 3: in their own proportions,
 * not cropped, two columns from md. Below the fold, so they load lazily.
 * No section without photos.
 */
export function ServiceGallery({ photos }: ServiceGalleryProps) {
  const t = useTranslations("ServicePage");
  if (photos.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="bilder-titel">
      <Container>
        <SectionHeading id="bilder-titel" title={t("galleryTitle")} />
        <ul className="mt-12 grid items-start gap-8 md:grid-cols-2">
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
      </Container>
    </Section>
  );
}
