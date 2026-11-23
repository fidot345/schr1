import { useGSAP } from "@gsap/react";
import { invalidate } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useEffect, useState } from "react";
import { useLenis } from "@/components/layout/SmoothScroll";
import { driveLenisWith, type FrameLoop } from "@/lib/smooth-scroll";
import {
  PARTS,
  type PartMotion,
  type SceneStep,
  STEP_RANGES,
  stepAt,
} from "./parts";

/*
 * The only GSAP code of the site, BRIEF.md section 4 "Как это устроено
 * технически". It comes with the 3D scene, so GSAP is not part of the first
 * load of the home page.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger);
// The scene does not jump when the phone hides its address bar.
ScrollTrigger.config({ ignoreMobileResize: true });
// Lenis runs on GSAP's ticker; after a stall it catches up at once.
gsap.ticker.lagSmoothing(0);

/** Everything the timeline moves; the scene reads it on every frame. */
export type WardrobeMotion = {
  /** One per part, in the order of PARTS. */
  parts: PartMotion[];
  /** Step 5: from the view from above to three quarters at eye level. */
  camera: number;
  /** Step 6: the wall of the room comes up. */
  room: number;
};

const createMotion = (): WardrobeMotion => ({
  parts: PARTS.map(() => ({ lift: 0, fly: 0, swing: 0 })),
  camera: 0,
  room: 0,
});

/** Pinned for three screens of scrolling on a computer, two and a half on a phone. */
const SCREENS = { desktop: "(width >= 48rem)", phone: "(width < 48rem)" };

/** Up, across and gently down: the curve of the brief for every motion. */
const EASE = "power2.inOut";

const stepRange = (step: SceneStep) => STEP_RANGES[step - 1];

/**
 * Tweens `key` of each target from 0 to 1 within [from, to]. Each tween
 * takes `share` of the stretch and they start one after another, evenly
 * spread over the rest, so the last one ends at `to`.
 */
function inTurn<T extends object>(
  timeline: gsap.core.Timeline,
  targets: T[],
  key: keyof T & string,
  [from, to]: [number, number],
  share: number,
) {
  const length = to - from;
  const duration = targets.length > 1 ? length * share : length;
  const offset =
    targets.length > 1 ? (length - duration) / (targets.length - 1) : 0;
  targets.forEach((target, index) => {
    timeline.to(
      target,
      { [key]: 1, duration, ease: EASE },
      from + index * offset,
    );
  });
}

/** The motions of the parts that arrive in `step`, in the order of PARTS. */
const motionsOf = (motion: WardrobeMotion, step: SceneStep): PartMotion[] =>
  PARTS.flatMap((part, index) =>
    part.step === step ? [motion.parts[index]] : [],
  );

/** The motions of the parts in the stack; rail and handles lie beside it. */
const stackedOf = (motion: WardrobeMotion): PartMotion[] =>
  PARTS.flatMap((part, index) =>
    part.stack.layer === null ? [] : [motion.parts[index]],
  );

/**
 * The storyboard of BRIEF.md section 4 on a timeline exactly 1 long, so its
 * time is the progress of the pinned scroll.
 */
function buildTimeline(timeline: gsap.core.Timeline, motion: WardrobeMotion) {
  const span = (step: SceneStep): [number, number] => {
    const { from, to } = stepRange(step);
    return [from, to];
  };
  const [doorsFrom, doorsTo] = span(4);

  // 1 Zuschnitt: the stack loosens, one layer after another from the top.
  inTurn(timeline, stackedOf(motion), "lift", span(1), 0.35);
  // 2 Korpus: sides, base, top and divider.
  inTurn(timeline, motionsOf(motion, 2), "fly", span(2), 0.5);
  // 3 Innenleben: shelves, rail and back panel.
  inTurn(timeline, motionsOf(motion, 3), "fly", span(3), 0.45);
  // 4 Fronten: the doors come in open, then close on their hinges.
  const doors = motionsOf(motion, 4);
  inTurn(timeline, doors, "fly", [doorsFrom, doorsFrom + 0.14], 0.75);
  inTurn(timeline, doors, "swing", [doorsFrom + 0.13, doorsTo], 0.7);
  // 5 Montage: the handles, and the camera goes down to eye level.
  const [mountFrom, mountTo] = span(5);
  inTurn(
    timeline,
    motionsOf(motion, 5),
    "fly",
    [mountFrom, mountTo - 0.04],
    0.7,
  );
  inTurn(timeline, [motion], "camera", span(5), 1);
  // 6 Fertig: the room around the wardrobe.
  inTurn(timeline, [motion], "room", span(6), 1);
}

/** GSAP's ticker as a frame loop for Lenis, in milliseconds as Lenis counts. */
const gsapTicker: FrameLoop = (frame) => {
  const tick = (time: number) => frame(time * 1000);
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
};

/**
 * The scroll drives the scene: `pin` stays on screen while one GSAP
 * timeline, scrubbed by ScrollTrigger, moves the returned object. Every
 * update of the timeline asks the canvas for a frame (frameloop "demand").
 * `onStep` hears the step under way when it changes; it has to stay the
 * same function (a state setter), or the timeline is built anew.
 *
 * Lenis gets GSAP's ticker as its clock and tells ScrollTrigger about each
 * scroll, the setup of the brief. useGSAP undoes the pin and the timeline
 * when the scene goes.
 */
export function useWardrobeTimeline(
  pin: RefObject<HTMLElement | null>,
  onStep: (step: SceneStep) => void,
): WardrobeMotion {
  const [motion] = useState(createMotion);
  const lenis = useLenis();

  useGSAP(
    () => {
      const panel = pin.current;
      if (!panel) return;

      // The scene can arrive when the window is already past the start of
      // the pin: the page was opened lower down, scrolled up from below or
      // jumped over the section with the skip link. The pin adds its scroll
      // length to the page there, so the window moves on by the same length
      // and keeps showing what it showed. Only for the first pin: a later
      // one (new screen size) replaces a pin that was already there.
      let firstPin = true;

      const screens = gsap.matchMedia();
      screens.add(SCREENS, (context) => {
        const desktop = context.conditions?.desktop ?? true;
        const passed = firstPin && panel.getBoundingClientRect().top < 0;
        firstPin = false;
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            pin: true,
            start: "top top",
            end: desktop ? "+=300%" : "+=250%",
            scrub: 0.6,
          },
        });
        buildTimeline(timeline, motion);

        // ScrollTrigger measures the pin on its next refresh, and puts the
        // scroll back where it was when that is done: move on after that.
        const keepView = () => {
          ScrollTrigger.removeEventListener("refresh", keepView);
          const trigger = timeline.scrollTrigger;
          if (!trigger) return;
          window.scrollTo(0, window.scrollY + trigger.end - trigger.start);
        };
        if (passed) ScrollTrigger.addEventListener("refresh", keepView);

        // Reported anew for each screen size: the step of the new timeline.
        let shown: SceneStep | null = null;
        const report = () => {
          const step = stepAt(timeline.progress());
          if (step !== shown) {
            shown = step;
            onStep(step);
          }
        };
        timeline.eventCallback("onUpdate", () => {
          invalidate();
          report();
        });
        report();

        // A new screen size starts from a fresh timeline: draw what it shows.
        return () => {
          ScrollTrigger.removeEventListener("refresh", keepView);
          invalidate();
        };
      });

      return () => screens.revert();
    },
    { dependencies: [motion, onStep, pin] },
  );

  useEffect(() => {
    if (!lenis) return;
    const stopUpdates = lenis.on("scroll", ScrollTrigger.update);
    const giveBack = driveLenisWith(lenis, gsapTicker);

    return () => {
      giveBack();
      stopUpdates();
    };
  }, [lenis]);

  return motion;
}
