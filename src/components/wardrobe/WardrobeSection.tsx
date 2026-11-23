"use client";

/*
 * Client component: the pinned 3D scene needs the reduced-motion setting,
 * WebGL and the scroll position, which exist only in the browser. The
 * server renders the panel with the flat wardrobe in place of the scene.
 */

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import type { SceneStepItem } from "@/lib/content";
import { REDUCED_MOTION_QUERY } from "@/lib/smooth-scroll";
import type { SceneStep } from "./parts";
import { WardrobeStill } from "./WardrobeStill";

/** three, fiber, drei and GSAP: loaded only when the section comes near. */
const WardrobeScene = dynamic(() => import("./WardrobeScene"), { ssr: false });

/** The scene loads once the section is one screen away, BRIEF.md "Загрузка". */
const NEAR = "100% 0px";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const motionAllowed = () => !window.matchMedia(REDUCED_MOTION_QUERY).matches;

let webgl2: boolean | undefined;
/** Whether the browser can draw the scene. Asked once, when it is needed. */
const hasWebGL2 = (): boolean => {
  webgl2 ??= document.createElement("canvas").getContext("webgl2") !== null;
  return webgl2;
};
const noSubscription = () => () => {};
/** Before hydration and on the server: the scene is expected. */
const expected = () => true;

/** Whether `element` has come within one screen of the viewport. Stays true. */
function useNear(element: RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const target = element.current;
    if (near || !target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: NEAR },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [element, near]);

  return near;
}

export type WardrobeSectionProps = {
  /** The six steps, from "Zuschnitt" to "Fertig", from the captions in the admin panel. */
  steps: SceneStepItem[];
};

/**
 * "Vom Brett zum Schrank", BRIEF.md section 4, step 1 of stage 5: the grey
 * prototype. The panel stays on screen (pinned) while the scroll builds
 * the wardrobe; next to the scene on a computer, under it on a phone, the
 * captions as a numbered list with the current step marked. On a phone the
 * other captions are there only for screen readers.
 *
 * With reduced motion or without WebGL 2 it is the still picture
 * (WardrobeStill). The link before the panel skips to the projects.
 */
export function WardrobeSection({ steps }: WardrobeSectionProps) {
  const t = useTranslations("HomePage");
  const panel = useRef<HTMLDivElement>(null);
  const near = useNear(panel);
  const [activeStep, setActiveStep] = useState<SceneStep>(1);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  const motion = useSyncExternalStore(
    subscribeToReducedMotion,
    motionAllowed,
    expected,
  );
  const webgl = useSyncExternalStore(
    noSubscription,
    near ? hasWebGL2 : expected,
    expected,
  );

  if (!motion || !webgl) {
    return <WardrobeStill steps={steps} />;
  }

  return (
    <Section labelledBy="szene-titel">
      <Container>
        <TextLink href="#projekte" tone="muted">
          {t("skipAnimation")}
        </TextLink>
      </Container>
      {/* Pinned at the top of the window: the space of the sticky bars stays empty. */}
      <div
        ref={panel}
        className="h-svh pt-(--header-height) max-md:pb-(--action-bar-height)"
      >
        <Container className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 py-6 md:grid-cols-[3fr_2fr] md:grid-rows-2 md:gap-x-12 md:gap-y-8 md:py-10">
          <SectionHeading
            id="szene-titel"
            title={t("sceneTitle")}
            intro={t("sceneIntro")}
            className="md:col-start-2 md:row-start-1 md:self-end"
          />
          <div className="relative min-h-0 md:col-start-1 md:row-span-2 md:row-start-1">
            {ready ? null : (
              <Image
                src="/images/3d/schrank-platzhalter.svg"
                alt={t("sceneImageAlt")}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-contain"
              />
            )}
            {near ? (
              <div className="absolute inset-0">
                <WardrobeScene
                  pin={panel}
                  onStep={setActiveStep}
                  onReady={onReady}
                />
              </div>
            ) : null}
          </div>
          <ol className="flex flex-col gap-5 max-md:min-h-28 md:col-start-2 md:row-start-2 md:self-start">
            {steps.map((step, index) => {
              const active = index + 1 === activeStep;

              return (
                <li
                  key={step.id}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-start gap-4",
                    active ? "text-graphit" : "text-schiefer max-md:sr-only",
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
        </Container>
      </div>
    </Section>
  );
}
