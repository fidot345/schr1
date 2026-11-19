import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/** A route from src/i18n/routing.ts, translated per locale by next-intl. */
export type InternalHref = ComponentProps<typeof Link>["href"];

/** Anything that leaves the site or the browser. Plain http is not allowed. */
export type ExternalHref =
  | `https://${string}`
  | `mailto:${string}`
  | `tel:${string}`;

/** dark: Tannengrün text on light backgrounds. light: for Graphit backgrounds. */
export type TextLinkTone = "dark" | "light";

const TONE_CLASS: Record<TextLinkTone, string> = {
  dark: "text-tannengruen hover:text-tannengruen-dunkel",
  light: "focus-ring-light text-papier hover:text-weiss",
};

export function textLinkClassName(tone: TextLinkTone = "dark") {
  return cn(
    "underline underline-offset-4 hover:decoration-2 motion-safe:transition-colors",
    TONE_CLASS[tone],
  );
}

export function isExternalHref(
  href: InternalHref | ExternalHref,
): href is ExternalHref {
  return typeof href === "string" && /^(https:|mailto:|tel:)/.test(href);
}

type TextLinkProps = {
  href: InternalHref | ExternalHref;
  tone?: TextLinkTone;
  className?: string;
  children: ReactNode;
};

export function TextLink({ href, tone, className, children }: TextLinkProps) {
  const classes = cn(textLinkClassName(tone), className);

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        rel={href.startsWith("https:") ? "noreferrer" : undefined}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
