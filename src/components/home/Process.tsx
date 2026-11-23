import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";

export type ProcessStep = { title: string; text: string };

export type ProcessContent = {
  /** The four steps, from the measuring to the installation. */
  steps: ProcessStep[];
  /**
   * The sentence next to the button: how long it takes. Left out where the
   * steps come from Payload, which has no field for it (the services page).
   */
  note?: string;
};

/**
 * "So läuft Ihr Auftrag", mockup 01f: a Moos band with the steps in a row,
 * each a round number, a title and a line of text. As many columns as fit,
 * 220px wide at least. Under a line: how long it takes and the request button.
 */
export function Process({ steps, note }: ProcessContent) {
  const t = useTranslations("HomePage");
  const tProcess = useTranslations("Process");

  return (
    <Section variant="moos" labelledBy="ablauf-titel">
      <Container>
        <SectionHeading id="ablauf-titel" title={tProcess("title")} />
        <ol className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <StepNumber value={index + 1} size={44} />
              <h3 className="mt-1 font-display text-h4">{step.title}</h3>
              <p className="text-ui">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-linie pt-8">
          {note ? <p className="text-lead">{note}</p> : null}
          <ButtonLink href="/anfrage" className="w-full md:w-auto">
            {t("requestCta")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
