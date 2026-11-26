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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import type { SceneStepItem } from "@/lib/content";
import { REDUCED_MOTION_QUERY } from "@/lib/smooth-scroll";
import {
  reportFailure,
  reportReducedMotion,
  SceneBoundary,
  type SceneFailure,
} from "./scene-failure";
import { type SceneStep, STEP_RANGES } from "./steps";
import { SCENE_HEADING, WardrobeStill } from "./WardrobeStill";

/** three, fiber, drei and GSAP: loaded only when the section comes near. */
const WardrobeScene = dynamic(() => import("./WardrobeScene"), { ssr: false });

/** The step of the finished wardrobe, where the button comes. */
const LAST_STEP = STEP_RANGES.length;

/** The scene loads once the section is one screen away, BRIEF.md "Загрузка". */
const NEAR = "100% 0px";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const motionAllowed = () => !window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Whether a new canvas gives a context of `kind`; the context is given back at once. */
const gives = (kind: "webgl2" | "webgl"): boolean => {
  const canvas = document.createElement("canvas");
  const context =
    kind === "webgl2"
      ? canvas.getContext("webgl2")
      : canvas.getContext("webgl");
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return context !== null;
};

let webgl2: boolean | undefined;
/**
 * Whether the browser can draw the scene. Asked once, when it is needed.
 * Browsers keep only a few WebGL contexts alive (fewer on a phone), so the
 * one asked for here is given back at once instead of when it is collected.
 */
const hasWebGL2 = (): boolean => {
  webgl2 ??= gives("webgl2");
  return webgl2;
};
const noSubscription = () => () => {};
/** Before hydration and on the server: the scene is expected. */
const expected = () => true;

/** Whether any of `element` is in the window. */
const onScreen = (element: HTMLElement | null): boolean => {
  const box = element?.getBoundingClientRect();
  return box !== undefined && box.bottom > 0 && box.top < window.innerHeight;
};

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
  /** The button of the last step, "Projekt anfragen", from the admin panel. */
  buttonLabel: string;
};

/**
 * "Vom Brett zum Schrank", BRIEF.md section 4, steps 1, 3, 4 and 5 of
 * stage 5: the scene in oak, light and shadow, pinned while the scroll
 * builds the wardrobe. On a computer the whole panel stays on screen, the
 * captions next to the scene as a numbered list with the current step
 * marked. On a phone the heading goes by above, and the scene stays on
 * screen with the current caption under it, BRIEF.md "Как ведёт себя": so
 * the scene takes most of the height and the wardrobe most of the width
 * (Maxon, session 37). There the other captions are for screen readers
 * only. The flat wardrobe stands in for the scene until its wood is
 * loaded, and while a lost WebGL context waits for the scene to be built
 * anew. When the wardrobe is finished (step 6), the button to the request
 * form comes up in the corner of the scene, as in mockup 02.
 *
 * A window too low for all six captions in full (low-screen in globals.css)
 * shows the text of the current step only, the others by their name.
 *
 * With reduced motion it is the still picture (WardrobeStill), and so it is
 * for good once the scene gives up: no WebGL 2, no context or the context
 * lost even after building the scene anew, lighter, three times
 * (WardrobeScene), its code or textures not loaded, an error while
 * drawing. Each failure leaves a warning with its code on the console.
 * Without JavaScript the same picture comes from <noscript> and the panel
 * is hidden. The link before the panel skips to the projects.
 */
export function WardrobeSection({ steps, buttonLabel }: WardrobeSectionProps) {
  const t = useTranslations("HomePage");
  const panel = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pins = useMemo(() => ({ desktop: panel, phone: stage }), []);
  const near = useNear(panel);
  const [activeStep, setActiveStep] = useState<SceneStep>(1);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setReady(false), []);

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

  useEffect(() => {
    if (!motion) reportReducedMotion();
  }, [motion]);

  useEffect(() => {
    if (webgl) return;
    reportFailure(
      "no-webgl2",
      gives("webgl")
        ? "WebGL 1 is there, but three.js draws with WebGL 2 only."
        : "No WebGL at all.",
    );
  }, [webgl]);

  // A failure while the panel is on screen: the still picture takes the
  // place of the panel in view. Without the pin the page is shorter, and
  // the window would land further down. Above the window, the browser's
  // scroll anchoring keeps what is in view.
  const [failure, setFailure] = useState<SceneFailure | null>(null);
  const failedInView = useRef(false);
  const fail = useCallback((reason: SceneFailure, cause?: unknown) => {
    reportFailure(reason, cause);
    failedInView.current = onScreen(panel.current);
    setFailure(reason);
  }, []);
  const onSceneError = useCallback(
    (error: unknown) => fail("scene-error", error),
    [fail],
  );

  useLayoutEffect(() => {
    if (!failure || !failedInView.current) return;
    failedInView.current = false;
    const still = document.getElementById(SCENE_HEADING)?.closest("section");
    if (!still) return;
    // Its top just under the sticky header.
    const header =
      document.querySelector<HTMLElement>("body > header")?.offsetHeight ?? 0;
    window.scrollTo({
      top: still.getBoundingClientRect().top + window.scrollY - header,
      behavior: "instant",
    });
  }, [failure]);

  if (!motion || !webgl || failure) {
    return <WardrobeStill steps={steps} buttonLabel={buttonLabel} />;
  }

  const finished = activeStep === LAST_STEP;

  return (
    <>
      {/* Only the server renders this; React leaves the inside of <noscript> alone. */}
      <noscript>
        <WardrobeStill
          steps={steps}
          buttonLabel={buttonLabel}
          headingId={`${SCENE_HEADING}-bild`}
        />
      </noscript>
      <Section labelledBy={SCENE_HEADING} className="noscript:hidden">
        <Container>
          <TextLink href="#projekte" tone="muted">
            {t("skipAnimation")}
          </TextLink>
        </Container>
        {/*
          On a computer this panel stays at the top of the window (pinned), the
          space of the sticky header kept empty.
        */}
        <div ref={panel} className="md:h-svh md:pt-(--header-height)">
          {/*
            On a computer the captions take the height they need and the heading
            the rest, so the last step stays on screen. The button shares the
            cell of the scene, so it follows the captions when read.
          */}
          <Container className="pt-4 md:grid md:h-full md:grid-cols-[3fr_2fr] md:grid-rows-[1fr_auto] md:gap-x-12 md:gap-y-8 md:py-10">
            <SectionHeading
              id={SCENE_HEADING}
              title={t("sceneTitle")}
              intro={t("sceneIntro")}
              className="md:col-start-2 md:row-start-1 md:self-end"
            />
            {/*
              On a phone the scene and its caption stay at the top of the window
              (pinned), between the sticky header and the action bar; the scene
              takes what the caption leaves. On a computer the two wrappers fall
              away and their parts take their cells in the panel.
            */}
            <div
              ref={stage}
              className="h-svh pt-(--header-height) pb-(--action-bar-height) md:contents"
            >
              <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-4 py-4 md:contents">
                {/* row-span sets all of grid-row: the start is given again after it. */}
                <div className="relative col-start-1 row-start-1 min-h-0 md:row-span-2 md:row-start-1">
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
                      <SceneBoundary onError={onSceneError}>
                        <WardrobeScene
                          pins={pins}
                          onStep={setActiveStep}
                          onReady={onReady}
                          onLost={onLost}
                          onFailure={fail}
                        />
                      </SceneBoundary>
                    </div>
                  ) : null}
                </div>
                <ol className="row-start-2 flex flex-col gap-5 max-md:min-h-28 md:col-start-2 md:self-start">
                  {steps.map((step, index) => {
                    const active = index + 1 === activeStep;

                    return (
                      <li
                        key={step.id}
                        aria-current={active ? "step" : undefined}
                        className={cn(
                          "flex items-start gap-4",
                          active
                            ? "text-graphit"
                            : "text-schiefer max-md:sr-only",
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
                          {/* A step with a name shows only that on a low screen, unless it is the current one. */}
                          <p
                            className={cn(
                              "text-small",
                              !active && step.title && "low-screen:sr-only",
                            )}
                          >
                            {step.text}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {/* Hidden until the wardrobe is finished: then it can be seen, read and focused. */}
                <ButtonLink
                  href="/anfrage"
                  size="header"
                  className={cn(
                    "relative z-10 col-start-1 row-start-1 m-4 self-end justify-self-end md:row-start-2",
                    !finished && "invisible",
                  )}
                >
                  {buttonLabel}
                </ButtonLink>
              </div>
            </div>
          </Container>
        </div>
      </Section>
    </>
  );
}
