import Image from "next/image";
import { cn } from "@/lib/cn";

/*
 * The mark is the fir tree from the mockup: four rectangles in a 30 x 34 box.
 * It lives in two places that must stay the same: public/images/logo-mark.svg
 * (favicon, Payload admin) and LogoGlyph below (the site, where the color
 * changes per variant). tests/unit/logo.test.ts compares them. Replace both,
 * and its copy src/app/icon.svg, to change the logo everywhere.
 */
export const LOGO_MARK_SRC = "/images/logo-mark.svg";

const MARK_WIDTH = 30;
const MARK_HEIGHT = 34;

type LogoMarkProps = {
  /** Height of the mark in px; the width follows from the mark's proportions. */
  size: number;
  alt: string;
  className?: string;
  /** "eager" for marks above the fold (the admin login). */
  loading?: "eager" | "lazy";
};

/**
 * The mark as a file. The Payload admin draws its logo and nav icon with it
 * (components/admin/AdminGraphics.tsx), so keep these props as they are.
 */
export function LogoMark({ size, alt, className, loading }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_MARK_SRC}
      width={Math.round((size * MARK_WIDTH) / MARK_HEIGHT)}
      height={size}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}

type LogoGlyphProps = {
  width: number;
  height: number;
  /** The mark takes the text color: set it with text-* here. */
  className?: string;
};

/** The mark as an inline SVG. Decorative: the words next to it name the company. */
function LogoGlyph({ width, height, className }: LogoGlyphProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`}
      aria-hidden="true"
      fill="currentColor"
      className={cn("shrink-0", className)}
    >
      <rect x="10" y="2" width="10" height="5" rx="1" />
      <rect x="5" y="10" width="20" height="5" rx="1" />
      <rect x="0" y="18" width="30" height="5" rx="1" />
      <rect x="12.5" y="25" width="5" height="9" rx="1" />
    </svg>
  );
}

export type LogoVariant = "full" | "compact" | "light";

type LogoProps = {
  /**
   * full: the header from 1280px, with the descriptor above the name.
   * compact: the phone header, without the descriptor.
   * light: for the Graphit footer.
   */
  variant?: LogoVariant;
  /** The word next to the mark, "Tannrieder": the logo word from SiteSettings. */
  name: string;
  /** "Schreinerei", above the name. Only the full variant shows it. */
  descriptor?: string;
  className?: string;
};

/*
 * The only place where the logo sizes live (docs/REDESIGN.md, "Шкала текста":
 * the logo is the one exception to the scale): 28px and 24px for the name,
 * and the mark in 30x34, 24x27 and 26x30.
 */
export function Logo({
  variant = "full",
  name,
  descriptor,
  className,
}: LogoProps) {
  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center gap-3", className)}>
        <LogoGlyph width={30} height={34} className="text-tannengruen" />
        <span className="flex flex-col leading-[1.05]">
          {descriptor ? (
            <>
              <span className="text-xs leading-[1.05] text-schiefer">
                {descriptor}
              </span>
              {/* A space for assistive technology: "Schreinerei Tannrieder", not "SchreinereiTannrieder". */}{" "}
            </>
          ) : null}
          <span className="font-display text-[1.75rem] leading-[1.05] font-semibold text-tannengruen">
            {name}
          </span>
        </span>
      </span>
    );
  }

  const light = variant === "light";

  return (
    <span
      className={cn(
        "inline-flex items-center",
        light ? "gap-3" : "gap-2.5",
        className,
      )}
    >
      <LogoGlyph
        width={light ? 26 : 24}
        height={light ? 30 : 27}
        className={light ? "text-moos" : "text-tannengruen"}
      />
      {/*
        In the phone header a name too long for the row wraps, in lines as
        tight as the full logo's, so the header keeps its 64px; a single
        word too long breaks where it has to.
      */}
      <span
        className={cn(
          "font-display text-[1.5rem] font-semibold",
          light
            ? "text-weiss"
            : "leading-[1.05] wrap-anywhere text-tannengruen",
        )}
      >
        {name}
      </span>
    </span>
  );
}
