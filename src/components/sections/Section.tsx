import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/cn";

type SectionProps = {
  /** Unique on the page; the heading gets `${id}-title`. */
  id: string;
  title: ReactNode;
  /** Moos: the light surface for single sections, BRIEF.md section 3. */
  tone?: "plain" | "moos";
  className?: string;
  children: ReactNode;
};

/**
 * A block of a page with its h2. Sections carry no outer spacing: the page
 * puts the gap between them, so a Moos surface keeps the same distance to
 * its neighbours as plain blocks do.
 */
export function Section({
  id,
  title,
  tone = "plain",
  className,
  children,
}: SectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(tone === "moos" && "bg-moos py-section", className)}
    >
      <Container className="flex flex-col gap-8 md:gap-12">
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
        {children}
      </Container>
    </section>
  );
}
