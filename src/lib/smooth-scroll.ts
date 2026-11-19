import Lenis from "lenis";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

  const update = () => {
    if (reducedMotion.matches) {
      lenis?.destroy();
      lenis = null;
    } else if (!lenis) {
      // Anchor links (#id) stay native: the browser jumps to the target and
      // Lenis follows the scroll position. Its own anchor handling would
      // swallow the click and the fragment in the address.
      lenis = new Lenis({ autoRaf: true });
    }
    onChange(lenis);
  };

  update();
  reducedMotion.addEventListener("change", update);

  return () => {
    reducedMotion.removeEventListener("change", update);
    lenis?.destroy();
    lenis = null;
  };
}
