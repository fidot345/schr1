import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TestimonialItem } from "@/lib/content";

type TestimonialsProps = {
  /** The first testimonials of the admin panel, without quotation marks. */
  testimonials: TestimonialItem[];
};

/**
 * "Was Kunden sagen", mockup 01i: the quotes in a row, each under a 2px
 * Tannengrün line. The quotation marks come from messages, so each language
 * has its own. As many columns as fit, 280px wide at least. No section
 * without testimonials.
 */
export function Testimonials({ testimonials }: TestimonialsProps) {
  const t = useTranslations("HomePage");
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="stimmen-titel">
      <Container>
        <SectionHeading id="stimmen-titel" title={t("testimonialsTitle")} />
        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10">
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="border-t-2 border-tannengruen pt-6"
            >
              <blockquote>
                <p className="text-lead">{t("quote", { text: item.quote })}</p>
              </blockquote>
              <figcaption className="mt-4 text-xs text-schiefer">
                {item.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
