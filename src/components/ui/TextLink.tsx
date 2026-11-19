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

export const textLinkClassName =
  "text-tannengruen underline underline-offset-4 hover:text-tannengruen-dunkel hover:decoration-2 motion-safe:transition-colors";

export function isExternalHref(
  href: InternalHref | ExternalHref,
): href is ExternalHref {
  return typeof href === "string" && /^(https:|mailto:|tel:)/.test(href);
}

type TextLinkProps = {
  href: InternalHref | ExternalHref;
  className?: string;
  children: ReactNode;
};

export function TextLink({ href, className, children }: TextLinkProps) {
  const classes = cn(textLinkClassName, className);

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
