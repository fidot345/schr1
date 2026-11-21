import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { AppLink } from "./AppLink";

/*
 * Links from the mockup. The color, the underline and the hover color come
 * from the base styles for `a` in globals.css, so a link on a dark surface
 * can still set its own color with className.
 *
 * strong: bold, "Alle Referenzen ansehen", "Mehr über uns"
 * plain:  regular weight, in a text, the e-mail address
 * muted:  small and Schiefer, "Animation überspringen"
 */
export type TextLinkTone = "strong" | "plain" | "muted";

const TONE: Record<TextLinkTone, string | undefined> = {
  strong: "font-bold",
  plain: undefined,
  muted: "text-xs text-schiefer hover:text-tannengruen-dunkel",
};

type TextLinkProps = ComponentProps<typeof AppLink> & {
  tone?: TextLinkTone;
};

export function TextLink({
  tone = "strong",
  className,
  ...rest
}: TextLinkProps) {
  // `|| undefined`: a plain link has no classes, and class="" is just noise.
  return (
    <AppLink className={cn(TONE[tone], className) || undefined} {...rest} />
  );
}
