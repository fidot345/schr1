import type { Messages } from "next-intl";
import type { InternalHref } from "@/components/ui/TextLink";
import type { routing } from "@/i18n/routing";

export type NavigationItem = {
  href: InternalHref;
  /** Key in the "Navigation" namespace of messages/*.json. */
  label: keyof Messages["Navigation"];
};

/** Main menu, BRIEF.md section 2. The header and the footer use it. */
export const MAIN_NAVIGATION = [
  { href: "/leistungen", label: "services" },
  { href: "/referenzen", label: "projects" },
  { href: "/ueber-uns", label: "about" },
  { href: "/karriere", label: "careers" },
  { href: "/kontakt", label: "contact" },
] as const satisfies readonly NavigationItem[];

export const LEGAL_NAVIGATION = [
  { href: "/impressum", label: "imprint" },
  { href: "/datenschutz", label: "privacy" },
] as const satisfies readonly NavigationItem[];

/** Internal pathname from src/i18n/routing.ts, as next-intl's usePathname returns it. */
export type Pathname = keyof typeof routing.pathnames;

/**
 * Pages without the mobile action bar: the ones with a form (request,
 * careers, job) and the contact page, which shows the phone and the request
 * button itself. Decision by Maxon, session 15.
 */
export const PAGES_WITHOUT_ACTION_BAR = [
  "/anfrage",
  "/kontakt",
  "/karriere",
  "/karriere/[slug]",
] as const satisfies readonly Pathname[];

export const showsActionBar = (pathname: Pathname): boolean =>
  !(PAGES_WITHOUT_ACTION_BAR as readonly Pathname[]).includes(pathname);
