"use client";

/*
 * Client component: opening, closing, focus and scroll lock need the browser.
 * The menu content stays a server component and comes in as children.
 */

import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { buttonClassName } from "@/components/ui/Button";
import { usePathname } from "@/i18n/navigation";

/** Tailwind's xl breakpoint: from here on the header shows the full menu. */
const WIDE_SCREEN = "(min-width: 80rem)";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.getClientRects().length > 0,
  );

/** Every element outside `inside`: its siblings and those of its ancestors. */
const elementsOutside = (inside: Element): Element[] => {
  const outside: Element[] = [];
  let node: Element | null = inside;
  while (node?.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node) outside.push(sibling);
    }
    node = node.parentElement === document.body ? null : node.parentElement;
  }
  return outside;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {open ? (
        <path d="M5 5l14 14M19 5L5 19" />
      ) : (
        <path d="M3 6h18M3 12h18M3 18h18" />
      )}
    </svg>
  );
}

type MobileMenuProps = {
  /** The menu content: navigation, language switcher, request button. */
  children: ReactNode;
};

/**
 * Full-screen menu below xl, BRIEF.md section 3. It opens under the header,
 * so the button stays in place and closes it again.
 *
 * Open: focus moves to the first link, Tab cycles between the button and the
 * menu, everything outside the header is inert, the page does not scroll.
 * Closed by the button, Esc or any link, focus goes back to the button.
 * No transition: the menu appears and disappears at once.
 */
export function MobileMenu({ children }: MobileMenuProps) {
  const t = useTranslations("Header");
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Closes on a route change that did not come from a menu link (back button).
  const pathname = usePathname();
  const [shownPathname, setShownPathname] = useState(pathname);
  if (pathname !== shownPathname) {
    setShownPathname(pathname);
    setOpen(false);
  }

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    const header = button?.closest("header");
    if (!open || !button || !panel || !header) return;

    const close = () => {
      setOpen(false);
      button.focus();
    };

    // The panel starts right under the header, whatever its height is now.
    const place = () => {
      panel.style.top = `${header.getBoundingClientRect().bottom}px`;
    };
    place();

    const root = document.documentElement;
    const { overflow, scrollbarGutter } = root.style;
    root.style.overflow = "hidden";
    // Keeps the scrollbar's space, so the page does not jump sideways.
    root.style.scrollbarGutter = "stable";

    const inert = elementsOutside(header).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && !element.inert,
    );
    for (const element of inert) element.inert = true;

    focusablesIn(panel)[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const cycle = [button, ...focusablesIn(panel)];
      const first = cycle[0];
      const last = cycle[cycle.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !cycle.includes(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPanelClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        close();
      }
    };

    const wide = window.matchMedia(WIDE_SCREEN);
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    panel.addEventListener("click", onPanelClick);
    window.addEventListener("resize", place);
    wide.addEventListener("change", onWide);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      panel.removeEventListener("click", onPanelClick);
      window.removeEventListener("resize", place);
      wide.removeEventListener("change", onWide);
      for (const element of inert) element.inert = false;
      root.style.overflow = overflow;
      root.style.scrollbarGutter = scrollbarGutter;
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={buttonClassName("secondary")}
      >
        <MenuIcon open={open} />
        {t("menuButton")}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain bg-papier xl:hidden"
      >
        {children}
      </div>
    </>
  );
}
