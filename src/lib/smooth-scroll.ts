import Lenis from "lenis";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * A frame loop: calls `frame` once per frame with a time in milliseconds,
 * until the returned function stops it.
 */
export type FrameLoop = (frame: (time: number) => void) => () => void;

/** The browser's own frame loop. Lenis runs on it unless it is lent out. */
const animationFrames: FrameLoop = (frame) => {
  let id = requestAnimationFrame(function tick(time) {
    frame(time);
    id = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(id);
};

/** Moves a running Lenis to another frame loop. */
const clocks = new WeakMap<Lenis, (loop: FrameLoop) => void>();

/**
 * Runs `lenis` on the browser's frame loop and lets driveLenisWith swap the
 * loop. Each loop counts time from its own start, so a swap resets the time
 * Lenis keeps: its first frame on the new loop moves by nothing instead of
 * by the gap between the two clocks. Returns a function that stops it.
 */
function startClock(lenis: Lenis): () => void {
  let stop = animationFrames(lenis.raf);
  clocks.set(lenis, (loop) => {
    stop();
    lenis.time = 0;
    stop = loop(lenis.raf);
  });

  return () => {
    stop();
    clocks.delete(lenis);
  };
}

/**
 * Drives `lenis` with `loop` instead of the browser's frame loop until the
 * returned function hands it back. The 3D scene lends it GSAP's ticker
 * (BRIEF.md section 4), so the scroll, ScrollTrigger and the scrubbed
 * timeline move in the same tick. A Lenis that is gone is left alone.
 */
export function driveLenisWith(lenis: Lenis, loop: FrameLoop): () => void {
  const swap = clocks.get(lenis);
  if (!swap) return () => {};
  swap(loop);

  return () => clocks.get(lenis)?.(animationFrames);
}

/**
 * Smooth scrolling with Lenis, BRIEF.md sections 3 and 4: one instance for
 * the whole site, none while the system asks to reduce motion. The setting
 * is watched, so turning it on or off applies at once, without a reload.
 *
 * `onChange` gets the running instance, or null while there is none.
 * Returns a cleanup that stops watching and destroys the instance.
 */
export function watchSmoothScroll(
  onChange: (lenis: Lenis | null) => void,
): () => void {
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  let lenis: Lenis | null = null;
  let stopClock = () => {};

  const destroy = () => {
    stopClock();
    stopClock = () => {};
    lenis?.destroy();
    lenis = null;
  };

  const update = () => {
    if (reducedMotion.matches) {
      destroy();
    } else if (!lenis) {
      // Anchor links (#id) stay native: the browser jumps to the target and
      // Lenis follows the scroll position. Its own anchor handling would
      // swallow the click and the fragment in the address. Its frames come
      // from startClock, so the 3D scene can hand them to GSAP.
      lenis = new Lenis({ autoRaf: false });
      stopClock = startClock(lenis);
    }
    onChange(lenis);
  };

  update();
  reducedMotion.addEventListener("change", update);

  return () => {
    reducedMotion.removeEventListener("change", update);
    destroy();
  };
}
