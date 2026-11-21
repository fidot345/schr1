import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { Photo } from "@/lib/media";

type ServiceIntroProps = {
  title: string;
  /** The paragraphs of the introduction. */
  intro: string[];
  photo: Photo | null;
};

/**
 * The top of a service page, BRIEF.md section 2, laid out like the home
 * page's first screen (01b): from lg the text on the left and the cover on
 * the right, bottom edges level; below lg one column with the text first.
 * The cover is 4:5 on the phone and 3:2 from md (BRIEF.md section 3) and
 * the largest element on screen, so it loads first.
 */
export function ServiceIntro({ title, intro, photo }: ServiceIntroProps) {
  const t = useTranslations("ServicePage");

  return (
    <Section
      labelledBy="leistung-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-12">
        <div className="min-w-0 max-w-135 lg:flex-[1_1_400px] lg:pb-2">
          <h1 id="leistung-titel" className="font-display text-h1">
            {title}
          </h1>
          {intro.map((paragraph, index) => (
            <p
              key={paragraph}
              className={index === 0 ? "mt-6 text-lead" : "mt-4"}
            >
              {paragraph}
            </p>
          ))}
          <ButtonLink href="/anfrage" className="mt-9 w-full md:w-auto">
            {t("requestCta")}
          </ButtonLink>
        </div>
        <div className="min-w-0 lg:flex-[1.4_1_520px]">
          <CmsImage
            photo={photo}
            frameClassName="aspect-4/5 md:aspect-3/2"
            sizes="(min-width: 80rem) 700px, (min-width: 64rem) 58vw, 100vw"
            priority
          />
        </div>
      </Container>
    </Section>
  );
}
