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
 * A new page starts at the very top, without animation. Back and forward
 * are left alone: there the browser brings back the old position.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => watchSmoothScroll(setLenis), []);

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
