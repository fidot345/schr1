import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

type VacationBannerProps = {
  /** First day of the holiday, ISO date from Payload. */
  from?: string | null;
  /** Last day of the holiday, ISO date from Payload. */
  to?: string | null;
  /**
   * The region's name for screen readers, "Betriebsurlaub" when left out.
   * Two banners shown at once need different names.
   */
  label?: string;
};

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Strip above the header: "Betriebsurlaub vom … bis …" (BRIEF.md section 2).
 * Shows nothing unless both dates are given and valid. Dates are formatted
 * by next-intl in the page's locale and the workshop's time zone.
 *
 * It stands above the header, outside <main>, so it is a named region:
 * all content of a page belongs to a landmark (axe "region").
 */
export function VacationBanner({ from, to, label }: VacationBannerProps) {
  const t = useTranslations("VacationBanner");
  const start = toDate(from);
  const end = toDate(to);

  if (!start || !end || start > end) {
    return null;
  }

  return (
    <section aria-label={label ?? t("label")} className="bg-moos text-graphit">
      <Container>
        <p className="py-2">{t("text", { from: start, to: end })}</p>
      </Container>
    </section>
  );
}
