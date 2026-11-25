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
  Component,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { type SceneStep, STEP_RANGES } from "./parts";
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

let webgl2: boolean | undefined;
/**
 * Whether the browser can draw the scene. Asked once, when it is needed.
 * Browsers keep only a few WebGL contexts alive (fewer on a phone), so the
 * one asked for here is given back at once instead of when it is collected.
 */
const hasWebGL2 = (): boolean => {
  if (webgl2 === undefined) {
    const context = document.createElement("canvas").getContext("webgl2");
    webgl2 = context !== null;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webgl2;
};
const noSubscription = () => () => {};
/** Before hydration and on the server: the scene is expected. */
const expected = () => true;

/**
 * Why the still picture stands in for the scene, BRIEF.md "Запасной
 * вариант". Reduced motion is not one: that is a setting, not a failure.
 */
type SceneFailure =
  /** The browser gives no WebGL 2 context. */
  | "no-webgl2"
  /**
   * The browser took the context away while the scene ran: a phone short
   * of graphics memory, the app sent to the background, a reset of the GPU.
   */
  | "context-lost"
  /** The 3D code or the textures did not load, or the scene threw. */
  | "scene-error";

/**
 * One warning per failure, with its code first, so the console of a phone
 * (remote debugging) tells why it shows the still picture.
 */
const reportFailure = (reason: SceneFailure, error?: unknown) => {
  const message = `[wardrobe-scene] ${reason}: the still picture stands in for the 3D scene.`;
  if (error === undefined) console.warn(message);
  else console.warn(message, error);
};

type SceneBoundaryProps = {
  /** Hears what went wrong; the section then shows the still picture. */
  onError: (error: unknown) => void;
  children: ReactNode;
};

/**
 * Catches what goes wrong while the scene loads or draws: the import of its
 * code, the WebGL renderer that cannot be made, a texture that does not
 * come, an error in a frame. fiber passes errors of the canvas on to here.
 */
class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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
 * "Vom Brett zum Schrank", BRIEF.md section 4, steps 1, 3 and 4 of stage 5:
 * the scene in oak, light and shadow. The panel stays on screen (pinned)
 * while the scroll builds the wardrobe; next to the scene on a computer,
 * under it on a phone, the captions as a numbered list with the current
 * step marked. On a phone the other captions are there only for screen
 * readers. The flat wardrobe stands in for the scene until its wood is
 * loaded. When the wardrobe is finished (step 6), the button to the
 * request form comes up in the corner of the scene, as in mockup 02.
 *
 * A window too low for all six captions in full (low-screen in globals.css)
 * shows the text of the current step only, the others by their name.
 *
 * With reduced motion it is the still picture (WardrobeStill), and so it is
 * for good once the scene fails: no WebGL 2, the context lost while it
 * runs, its code or textures not loaded, an error while drawing. Each
 * failure leaves a warning with its code on the console. Without
 * JavaScript the same picture comes from <noscript> and the panel is
 * hidden. The link before the panel skips to the projects.
 */
export function WardrobeSection({ steps, buttonLabel }: WardrobeSectionProps) {
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

  useEffect(() => {
    if (!webgl) reportFailure("no-webgl2");
  }, [webgl]);

  // A failure while the panel is on screen: the still picture takes the
  // place of the panel in view. Without the pin the page is shorter, and
  // the window would land further down. Above the window, the browser's
  // scroll anchoring keeps what is in view.
  const [failure, setFailure] = useState<SceneFailure | null>(null);
  const failedInView = useRef(false);
  const fail = useCallback((reason: SceneFailure, error?: unknown) => {
    reportFailure(reason, error);
    failedInView.current = onScreen(panel.current);
    setFailure(reason);
  }, []);
  const onContextLost = useCallback(() => fail("context-lost"), [fail]);
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
        {/* Pinned at the top of the window: the space of the sticky bars stays empty. */}
        <div
          ref={panel}
          className="h-svh pt-(--header-height) max-md:pb-(--action-bar-height)"
        >
          {/*
            On a computer the captions take the height they need and the heading
            the rest, so the last step stays on screen. The button shares the
            cell of the scene, so it follows the captions when read.
          */}
          <Container className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 py-6 md:grid-cols-[3fr_2fr] md:grid-rows-[1fr_auto] md:gap-x-12 md:gap-y-8 md:py-10">
            <SectionHeading
              id={SCENE_HEADING}
              title={t("sceneTitle")}
              intro={t("sceneIntro")}
              className="md:col-start-2 md:row-start-1 md:self-end"
            />
            <div className="relative col-start-1 row-start-2 min-h-0 md:row-span-2 md:row-start-1">
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
                      pin={panel}
                      onStep={setActiveStep}
                      onReady={onReady}
                      onContextLost={onContextLost}
                    />
                  </SceneBoundary>
                </div>
              ) : null}
            </div>
            <ol className="row-start-3 flex flex-col gap-5 max-md:min-h-28 md:col-start-2 md:row-start-2 md:self-start">
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
                "relative z-10 col-start-1 row-start-2 m-4 self-end justify-self-end",
                !finished && "invisible",
              )}
            >
              {buttonLabel}
            </ButtonLink>
          </Container>
        </div>
      </Section>
    </>
  );
}
