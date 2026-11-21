import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import {
  PhotoPlaceholder,
  type PlaceholderPhoto,
} from "@/components/ui/PhotoPlaceholder";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";

export type AboutTeaserContent = {
  /** Two short paragraphs about the family and the team. */
  paragraphs: string[];
  photo: PlaceholderPhoto;
};

/**
 * "Familienbetrieb seit 1989", mockup 01h: the text with the link to the
 * about page on the left, the photo on the right, centered on each other.
 * Below 856px of width the photo goes under the text.
 */
export function AboutTeaser({ paragraphs, photo }: AboutTeaserContent) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="familie-titel">
      <Container className="flex flex-wrap items-center gap-14">
        <div className="min-w-0 flex-[5_1_380px]">
          <h2 id="familie-titel" className="font-display text-h2">
            {t("aboutTitle")}
          </h2>
          {paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className={cn("max-w-[34em]", index === 0 ? "mt-5" : "mt-4")}
            >
              {paragraph}
            </p>
          ))}
          <TextLink href="/ueber-uns" className="mt-6 inline-block">
            {t("aboutMore")}
          </TextLink>
        </div>
        <PhotoPlaceholder
          photo={photo}
          className="h-72 min-w-0 flex-[6_1_420px] md:h-110"
        />
      </Container>
    </Section>
  );
}
