import { useTranslations } from "next-intl";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { Photo } from "@/lib/media";

type CareersIntroProps = {
  /** The paragraphs of the careers text of the home page in Payload. */
  intro: string[];
  /** The photo of the same block: someone at work in the workshop. */
  photo: Photo | null;
};

/**
 * The top of /karriere, BRIEF.md section 2: the page title and a short text
 * about working here, laid out like the top of a service page: from lg the
 * text on the left and the photo on the right, bottom edges level; below lg
 * the photo under the text. Without a photo the text stands alone.
 */
export function CareersIntro({ intro, photo }: CareersIntroProps) {
  const t = useTranslations("CareersPage");

  return (
    <Section
      labelledBy="karriere-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-12">
        <div className="min-w-0 lg:flex-[1_1_400px] lg:pb-2">
          <h1 id="karriere-titel" className="font-display text-h1">
            {t("title")}
          </h1>
          {intro.map((paragraph, index) => (
            <p
              key={paragraph}
              className={
                index === 0
                  ? "mt-6 max-w-[34em] text-lead"
                  : "mt-4 max-w-[34em] text-lead"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
        {photo ? (
          <div className="min-w-0 lg:flex-[1.4_1_520px]">
            <CmsImage
              photo={photo}
              frameClassName="aspect-4/5 md:aspect-3/2"
              sizes="(min-width: 80rem) 700px, (min-width: 64rem) 58vw, 100vw"
              priority
            />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
