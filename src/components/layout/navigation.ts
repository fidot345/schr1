import type { Messages } from "next-intl";
import type { InternalHref } from "@/components/ui/TextLink";

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
