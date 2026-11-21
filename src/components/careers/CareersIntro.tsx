import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

type CareersIntroProps = {
  /** The paragraphs of the careers text of the home page in Payload. */
  intro: string[];
};

/**
 * The top of /karriere, BRIEF.md section 2: the page title and a short text
 * about working here, laid out like the top of /leistungen.
 */
export function CareersIntro({ intro }: CareersIntroProps) {
  const t = useTranslations("CareersPage");

  return (
    <Section
      labelledBy="karriere-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container>
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
      </Container>
    </Section>
  );
}
