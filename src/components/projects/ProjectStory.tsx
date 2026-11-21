import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ProjectStoryProps = {
  /** "Die Aufgabe", in paragraphs. */
  challenge: string[];
  /** "Unsere Lösung", in paragraphs. */
  solution: string[];
};

type StoryPartProps = {
  id: string;
  title: string;
  paragraphs: string[];
};

function StoryPart({ id, title, paragraphs }: StoryPartProps) {
  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <Section labelledBy={id}>
      <SectionHeading id={id} title={title} />
      {paragraphs.map((paragraph, index) => (
        <p
          key={paragraph}
          className={index === 0 ? "mt-6 max-w-[34em]" : "mt-4 max-w-[34em]"}
        >
          {paragraph}
        </p>
      ))}
    </Section>
  );
}

/**
 * "Die Aufgabe" and "Unsere Lösung", BRIEF.md section 2: two sections side
 * by side from md, one under the other on the phone. A part without text
 * is left out.
 */
export function ProjectStory({ challenge, solution }: ProjectStoryProps) {
  const t = useTranslations("ProjectPage");
  if (challenge.length === 0 && solution.length === 0) {
    return null;
  }

  return (
    <Container className="grid gap-x-8 md:grid-cols-2">
      <StoryPart
        id="aufgabe-titel"
        title={t("challengeTitle")}
        paragraphs={challenge}
      />
      <StoryPart
        id="loesung-titel"
        title={t("solutionTitle")}
        paragraphs={solution}
      />
    </Container>
  );
}
