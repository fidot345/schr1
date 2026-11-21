import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * A section of a page. The space above is 128px, 64px on the phone
 * (docs/REDESIGN.md, "Остальное"); the content goes into a Container inside.
 *
 * default: no background
 * moos:    a band on a Moos ground, "So läuft Ihr Auftrag" (01f)
 * line:    a white band with a line on top, "Sprechen Sie mit uns" (01j)
 */
export type SectionVariant = "default" | "moos" | "line";

const VARIANT: Record<SectionVariant, { space: string; look: string }> = {
  default: { space: "pt-16 md:pt-32", look: "" },
  moos: { space: "mt-16 md:mt-32", look: "bg-moos py-16 md:py-24" },
  line: {
    space: "mt-16 md:mt-32",
    look: "border-t border-linie bg-weiss py-16 md:py-24",
  },
};

type SectionProps = {
  variant?: SectionVariant;
  /** The id of the section's heading: every section is named by it. */
  labelledBy: string;
  id?: string;
  /**
   * "none" drops the space above, for a section that sets its own,
   * like the hero (56px in the mockup).
   */
  topSpace?: "default" | "none";
  className?: string;
  children: ReactNode;
};

export function Section({
  variant = "default",
  labelledBy,
  id,
  topSpace = "default",
  className,
  children,
}: SectionProps) {
  const { space, look } = VARIANT[variant];

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(topSpace === "default" && space, look, className)}
    >
      {children}
    </section>
  );
}
