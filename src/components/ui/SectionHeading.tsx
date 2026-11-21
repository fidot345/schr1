import type { AppHref } from "./AppLink";
import { TextLink } from "./TextLink";

type SectionHeadingProps = {
  /** The id the Section points at with aria-labelledby. */
  id: string;
  title: string;
  /** A sentence under the title, in Schiefer. */
  intro?: string;
  /** A link at the right edge of the title row, "Alle Referenzen ansehen" (01e). */
  link?: { href: AppHref; label: string };
  className?: string;
};

/** The h2 of a section with its introduction and a link (01c, 01e). */
export function SectionHeading({
  id,
  title,
  intro,
  link,
  className,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id={id} className="font-display text-h2">
          {title}
        </h2>
        {link ? <TextLink href={link.href}>{link.label}</TextLink> : null}
      </div>
      {intro ? (
        <p className="mt-4 max-w-[36em] text-schiefer">{intro}</p>
      ) : null}
    </div>
  );
}
