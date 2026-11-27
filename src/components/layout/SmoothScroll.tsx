"use client";

/*
 * Client component: Lenis, the reduced-motion setting and the scroll
 * position exist only in the browser. It renders no element of its own,
 * so <body> keeps the order VacationBanner, Header, main, Footer, bar.
 */

import type Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fragmentTarget,
  jumpWhenShown,
  watchLinkClicks,
} from "@/lib/anchor-links";
import { watchSmoothScroll } from "@/lib/smooth-scroll";

const LenisContext = createContext<Lenis | null>(null);

/**
 * The site's Lenis instance, or null while there is none: on the server,
 * before it starts and while the system asks to reduce motion.
 */
export const useLenis = (): Lenis | null => useContext(LenisContext);

type SmoothScrollProps = {
  children: ReactNode;
};

/**
 * Smooth scrolling for the whole site, BRIEF.md sections 3 and 4.
 *
 * A new page starts at the very top, without animation, or at the part of
 * the page its #fragment names. Back and forward are left alone: there the
 * browser brings back the old position.
 *
 * A link with a #fragment lands on its target: a smooth scroll that is
 * still running (right after the wheel) stops first, so it cannot carry
 * the page away again, and a link through the router jumps once the router
 * shows its address, also when that address is open already, as a plain
 * anchor does (jumpWhenShown).
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => watchSmoothScroll(setLenis), []);

  useEffect(() => {
    let cancelJump = () => {};
    const stopWatching = watchLinkClicks((href, to) => {
      cancelJump();
      if (!to.hash) return;
      if (lenis) {
        // The public way to drop Lenis's running animation.
        lenis.stop();
        lenis.start();
      }
      // A plain anchor ("#id") is the browser's own jump; a link through
      // the router gets its jump once the router shows the address.
      if (!href.startsWith("#")) {
        cancelJump = jumpWhenShown(to);
      }
    });

    return () => {
      stopWatching();
      cancelJump();
    };
  }, [lenis]);

  const traversal = useRef(false);
  useEffect(() => {
    const onPopState = () => {
      traversal.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const pathname = usePathname();
  const shownPathname = useRef(pathname);
  useEffect(() => {
    if (pathname === shownPathname.current) return;
    shownPathname.current = pathname;

    if (traversal.current) {
      traversal.current = false;
      return;
    }
    // A link to a part of the new page (/karriere?stelle=schnuppertag#bewerben
    // from the home page): its jump takes the page there, not to the top.
    if (fragmentTarget(window.location.hash)) {
      return;
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, lenis]);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
