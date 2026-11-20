import Image from "next/image";

/*
 * The mark lives in one file. Replace public/images/logo-mark.svg
 * (and its copy src/app/icon.svg) to change the logo everywhere:
 * site, favicon and Payload admin.
 */
export const LOGO_MARK_SRC = "/images/logo-mark.svg";

type LogoMarkProps = {
  size: number;
  alt: string;
  className?: string;
  /** "eager" for marks above the fold (header, admin login). */
  loading?: "eager" | "lazy";
};

export function LogoMark({ size, alt, className, loading }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_MARK_SRC}
      width={size}
      height={size}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}

type LogoProps = {
  /** The word next to the mark, "Tannrieder": brandWord() of the company name in SiteSettings. */
  name: string;
  className?: string;
};

export function Logo({ name, className }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-heading text-h4 font-semibold text-tannengruen ${className ?? ""}`}
    >
      {/* Decorative: the word next to it already names the company.
          Eager: the logo sits in the header, always above the fold. */}
      <LogoMark size={32} alt="" className="size-8 shrink-0" loading="eager" />
      <span>{name}</span>
    </span>
  );
}
