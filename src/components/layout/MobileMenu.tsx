"use client";

/*
 * Client component: opening, closing, focus and the scroll lock need the
 * browser. The content of the menu stays server-rendered and comes in as
 * props.
 */

import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { usePathname } from "@/i18n/navigation";
import { useLenis } from "./SmoothScroll";

/** Tailwind's xl breakpoint: from here on the header shows the full menu. */
const WIDE_SCREEN = "(min-width: 80rem)";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.getClientRects().length > 0,
  );

type MobileMenuProps = {
  /** The logo as a link to the home page: the left side of the top row. */
  home: ReactNode;
  /** The menu itself: navigation, language switcher, request button. */
  children: ReactNode;
};

/**
 * The phone menu below xl, docs/REDESIGN.md, session 3. Not in the mockup.
 *
 * A modal <dialog> over the whole screen on Papier. Its top row is the
 * header's row: the logo and a "Schließen" button in the place of "Menü".
 * Below come the menu items in h3, the language switcher and the request
 * button.
 *
 * showModal() makes the page behind inert and puts the dialog in the top
 * layer. Esc closes it. Tab cycles inside it. The page does not scroll:
 * overflow on <html> stops native scrolling, lenis.stop() the smooth one,
 * and data-lenis-prevent leaves wheel and touch in the dialog to the dialog.
 * After closing, focus goes back to "Menü". A link in the menu closes it
 * too. There is no transition: the menu appears and disappears at once.
 */
export function MobileMenu({ home, children }: MobileMenuProps) {
  const t = useTranslations("Header");
  const dialogId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Closes on a route change that did not come from a menu link (back button).
  const pathname = usePathname();
  const [shownPathname, setShownPathname] = useState(pathname);
  if (pathname !== shownPathname) {
    setShownPathname(pathname);
    setOpen(false);
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    dialog.showModal();
    closeRef.current?.focus();

    const root = document.documentElement;
    const { overflow, scrollbarGutter } = root.style;
    root.style.overflow = "hidden";
    // Keeps the scrollbar's space, so the page does not jump sideways.
    root.style.scrollbarGutter = "stable";

    const wide = window.matchMedia(WIDE_SCREEN);
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", onWide);

    return () => {
      wide.removeEventListener("change", onWide);
      root.style.overflow = overflow;
      root.style.scrollbarGutter = scrollbarGutter;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  // Separate from the effect above: Lenis can come or go while the menu is
  // open (reduced motion switched), and that must not move the focus again.
  const lenis = useLenis();
  useEffect(() => {
    if (!open || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [open, lenis]);

  // Esc closes the dialog by itself and fires "close"; so does dialog.close().
  const onClose = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const items = focusablesIn(event.currentTarget);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const closeOnLink = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="menu"
        icon={<MenuIcon />}
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
        className="xl:hidden"
      >
        {t("menuButton")}
      </Button>
      {/*
        No display class on the dialog itself: it would override the
        browser's display:none of a closed dialog.
      */}
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-label={t("menuButton")}
        data-sticky-bar
        data-lenis-prevent
        onClose={onClose}
        onKeyDown={onKeyDown}
        onClick={closeOnLink}
        className="m-0 size-full max-h-none max-w-none overflow-y-auto overscroll-contain border-0 bg-papier p-0 text-graphit xl:hidden"
      >
        <div className="flex min-h-(--header-height) items-center border-b border-linie">
          <Container className="flex w-full items-center justify-between gap-8 max-md:pr-4">
            {home}
            <Button
              ref={closeRef}
              variant="menu"
              icon={<CloseIcon />}
              onClick={() => setOpen(false)}
            >
              {t("menuClose")}
            </Button>
          </Container>
        </div>
        <Container className="pb-10">{children}</Container>
      </dialog>
    </>
  );
}
