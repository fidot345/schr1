import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TitledText } from "@/lib/content";

type CareersFaqProps = {
  /** Questions (title) and answers (text) of the "Karriere" block in Payload. */
  faq: TitledText[];
};

/**
 * Three or four frequent questions, BRIEF.md section 2 ("Brauche ich einen
 * Lebenslauf?" – "Nein."): open text between lines, no accordion, so every
 * answer is readable without a click and without JavaScript. A description
 * list, so a screen reader reads each answer after its question. No section
 * without questions.
 */
export function CareersFaq({ faq }: CareersFaqProps) {
  const t = useTranslations("CareersPage");
  if (faq.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="fragen-titel">
      <Container>
        <SectionHeading id="fragen-titel" title={t("faqTitle")} />
        <dl className="mt-8 border-b border-linie">
          {faq.map((entry) => (
            <div key={entry.id} className="border-t border-linie py-5">
              <dt className="font-display text-h4">{entry.title}</dt>
              <dd className="mt-2 max-w-[34em]">{entry.text}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
