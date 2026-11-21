import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/Heading";
import type { ProcessStep } from "@/lib/content";
import { Section } from "./Section";

type ProcessSectionProps = {
  /** Unique on the page, for example "home-process". */
  id: string;
  /** The four steps from the HomePage global. */
  steps: ProcessStep[];
};

/**
 * "So läuft Ihr Auftrag": four steps in order, BRIEF.md section 2, on the
 * home page and the services page. A real sequence, so the numbers are
 * allowed (section 3). The <ol> already tells screen readers the position,
 * the visible number is hidden from them.
 */
export function ProcessSection({ id, steps }: ProcessSectionProps) {
  const t = useTranslations("Process");

  return (
    <Section id={id} title={t("title")} tone="moos">
      <ol className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.id} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className="font-heading text-h2 font-semibold text-tannengruen"
            >
              {index + 1}
            </span>
            <Heading level={3} size={4}>
              {step.title}
            </Heading>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
