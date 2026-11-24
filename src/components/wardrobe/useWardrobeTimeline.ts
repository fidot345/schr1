import { useGSAP } from "@gsap/react";
import { invalidate } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useEffect, useState } from "react";
import { useLenis } from "@/components/layout/SmoothScroll";
import { driveLenisWith, type FrameLoop } from "@/lib/smooth-scroll";
import { type SceneStep, stepAt } from "./parts";
import { buildTimeline, createMotion, type WardrobeMotion } from "./storyboard";

/*
 * The scroll side of the only GSAP code of the site, BRIEF.md section 4
 * "Как это устроено технически"; the storyboard itself is storyboard.ts.
 * It comes with the 3D scene, so GSAP is not part of the first load of the
 * home page.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger);
// The scene does not jump when the phone hides its address bar.
ScrollTrigger.config({ ignoreMobileResize: true });
// Lenis runs on GSAP's ticker; after a stall it catches up at once.
gsap.ticker.lagSmoothing(0);

/** Pinned for three screens of scrolling on a computer, two and a half on a phone. */
const SCREENS = { desktop: "(width >= 48rem)", phone: "(width < 48rem)" };

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
