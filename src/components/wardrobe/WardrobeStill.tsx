import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import type { SceneStepItem } from "@/lib/content";

/** The id of the heading that names the section. */
export const SCENE_HEADING = "szene-titel";

export type WardrobeStillProps = {
  /** The six steps, from "Zuschnitt" to "Fertig", from the captions in the admin panel. */
  steps: SceneStepItem[];
  /** The button after the last step, "Projekt anfragen", from the admin panel. */
  buttonLabel: string;
  /** The current step, counted from 1. It gets the filled number; none without it. */
  activeStep?: number;
  /** The id of the heading; another one where the scene's panel has the same heading. */
  headingId?: string;
};

/**
 * "Vom Brett zum Schrank" as a still picture, mockup 01d: the flat wardrobe
 * from public/images/3d, all six captions as a list and the button to the
 * request form. This is the fallback of BRIEF.md section 4 ("Запасной
 * вариант"): WardrobeSection shows it instead of the 3D scene while the
 * system asks to reduce motion, where the browser has no WebGL 2 and,
 * through <noscript>, without JavaScript. Nothing is pinned. A caption
 * without a step name in front shows only its text.
 */
export function WardrobeStill({
  steps,
  buttonLabel,
  activeStep,
  headingId = SCENE_HEADING,
}: WardrobeStillProps) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy={headingId}>
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
              id={headingId}
              title={t("sceneTitle")}
              intro={t("sceneIntro")}
            />
            <ol className="mt-8 flex flex-col gap-5">
              {steps.map((step, index) => {
                const active = index + 1 === activeStep;

                return (
                  <li
                    key={step.id}
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
                      {step.title ? (
                        <p
                          className={cn(
                            "mb-0.5 font-display text-h4",
                            active && "text-tannengruen",
                          )}
                        >
                          {step.title}
                        </p>
                      ) : null}
                      <p className="text-small">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <ButtonLink href="/anfrage" className="mt-8 w-full md:w-auto">
              {buttonLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
