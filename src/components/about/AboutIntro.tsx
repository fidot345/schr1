import { useTranslations } from "next-intl";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { Photo } from "@/lib/media";

type AboutIntroProps = {
  /** The h1: the title of the "Über uns" block of the home page in Payload. */
  title: string;
  /** The story, in paragraphs, from the same block. */
  story: string[];
  /** The photo of the workshop from the same block. */
  photo: Photo | null;
};

/**
 * The top of /ueber-uns, BRIEF.md section 2: the story from 1989 to today
 * and under it a line with the mark "Meisterbetrieb", laid out like the top
 * of a service page: from lg the text on the left and the photo of the
 * workshop on the right, bottom edges level; below lg the photo under the
 * text. The photo is the largest element on screen, so it loads first.
 * Without a photo the text stands alone.
 */
export function AboutIntro({ title, story, photo }: AboutIntroProps) {
  const t = useTranslations("AboutPage");

  return (
    <Section
      labelledBy="ueber-uns-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-12">
        <div className="min-w-0 lg:flex-[1_1_400px] lg:pb-2">
          <h1 id="ueber-uns-titel" className="font-display text-h1">
            {title}
          </h1>
          {story.map((paragraph, index) => (
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
          <p className="mt-10 border-t border-linie pt-6 text-ui font-bold">
            {t("master")}
          </p>
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
