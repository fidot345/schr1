import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ListItem } from "@/lib/content";

type CareersBenefitsProps = {
  /** Why it is good to work here, from the "Karriere" block in Payload. */
  benefits: ListItem[];
};

/**
 * Why it is good to work here, BRIEF.md section 2: up to four short lines
 * between lines, in two columns from md, like the lists of a job page. No
 * section without lines.
 */
export function CareersBenefits({ benefits }: CareersBenefitsProps) {
  const t = useTranslations("CareersPage");
  if (benefits.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="vorteile-titel">
      <Container>
        <SectionHeading id="vorteile-titel" title={t("benefitsTitle")} />
        <ul className="mt-8 grid gap-x-10 border-b border-linie md:grid-cols-2">
          {benefits.map((benefit) => (
            <li key={benefit.id} className="border-t border-linie py-4 text-ui">
              {benefit.text}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
