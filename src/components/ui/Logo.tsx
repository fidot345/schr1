import Image from "next/image";

/*
 * The mark lives in one file. Replace public/images/logo-mark.svg
 * (and its copy src/app/icon.svg) to change the logo everywhere:
 * site, favicon and Payload admin.
 */
export const LOGO_MARK_SRC = "/images/logo-mark.svg";

const BRAND_WORD = "Tannrieder";

type LogoMarkProps = {
  size: number;
  alt: string;
  className?: string;
};

export function LogoMark({ size, alt, className }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_MARK_SRC}
      width={size}
      height={size}
      alt={alt}
      className={className}
    />
  );
}

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-heading text-h4 font-semibold text-tannengruen ${className ?? ""}`}
    >
      {/* Decorative: the word next to it already names the company. */}
      <LogoMark size={32} alt="" className="size-8 shrink-0" />
      <span>{BRAND_WORD}</span>
    </span>
  );
}
