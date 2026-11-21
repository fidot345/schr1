import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";

export type WardrobeStep = { title: string; text: string };

export type WardrobeContent = {
  /** The sentence under the heading. */
  intro: string;
  /** The six steps, from "Zuschnitt" to "Fertig". */
  steps: WardrobeStep[];
};

export type WardrobeSectionProps = WardrobeContent & {
  /** The current step, counted from 1. It gets the filled number. */
  activeStep: number;
};

/**
 * TEMP(stage-5): "Vom Brett zum Schrank" as a still picture, mockup 01d. The
 * flat wardrobe from public/images/3d stands in for the 3D scene, and
 * activeStep is fixed by the page. Stage 5 replaces the picture with the
 * scene and drives activeStep from the scroll position.
 */
export function WardrobeSection({
  intro,
  steps,
  activeStep,
}: WardrobeSectionProps) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="szene-titel">
      <Container>
        <TextLink href="#projekte" tone="muted">
          {t("skipAnimation")}
        </TextLink>
        <div className="mt-4 flex flex-wrap items-center gap-12">
          <div className="relative h-72 min-w-0 flex-[3_1_520px] md:h-160">
            <Image
              src="/images/3d/schrank-platzhalter.svg"
              alt={t("sceneImageAlt")}
              fill
              sizes="(min-width: 1280px) 700px, 100vw"
              className="object-contain"
            />
          </div>
          <div className="min-w-0 flex-[2_1_360px]">
            <SectionHeading
              id="szene-titel"
              title={t("sceneTitle")}
              intro={intro}
            />
            <ol className="mt-8 flex flex-col gap-5">
              {steps.map((step, index) => {
                const active = index + 1 === activeStep;

                return (
                  <li
                    key={step.title}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex items-start gap-4",
                      active ? "text-graphit" : "text-schiefer",
                    )}
                  >
                    <StepNumber
                      value={index + 1}
                      state={active ? "active" : "muted"}
                    />
                    <div>
                      <p
                        className={cn(
                          "font-display text-h4",
                          active && "text-tannengruen",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-small">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}
