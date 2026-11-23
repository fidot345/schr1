import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TitledText } from "@/lib/content";

type AboutPrinciplesProps = {
  /** "So arbeiten wir" of the "Über uns" block in Payload, up to three. */
  principles: TitledText[];
};

/**
 * Three short principles of the workshop, BRIEF.md section 2: a Moos band
 * like "So läuft Ihr Auftrag" (01f), each a heading and a line of text, as
 * many columns as fit. No numbers: the principles have no order (BRIEF.md
 * section 3, "Чего избегаем"). No section without principles.
 */
export function AboutPrinciples({ principles }: AboutPrinciplesProps) {
  const t = useTranslations("AboutPage");
  if (principles.length === 0) {
    return null;
  }

  return (
    <Section variant="moos" labelledBy="grundsaetze-titel">
      <Container>
        <SectionHeading id="grundsaetze-titel" title={t("principlesTitle")} />
        <ul className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10">
          {principles.map((principle) => (
            <li key={principle.id} className="flex flex-col gap-3">
              <h3 className="font-display text-h4">{principle.title}</h3>
              <p className="text-ui">{principle.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
