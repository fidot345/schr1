import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

type AboutIntroProps = {
  /** The h1: the title of the "Über uns" block of the home page in Payload. */
  title: string;
  /** The story, in paragraphs, from the same block. */
  story: string[];
};

/**
 * The top of /ueber-uns, BRIEF.md section 2: the story from 1989 to today
 * and under it a line with the mark "Meisterbetrieb", laid out like the
 * top of /leistungen and the facts line of the first screen (01b).
 */
export function AboutIntro({ title, story }: AboutIntroProps) {
  const t = useTranslations("AboutPage");

  return (
    <Section
      labelledBy="ueber-uns-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container>
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
      </Container>
    </Section>
  );
}
