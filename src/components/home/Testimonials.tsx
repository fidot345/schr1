import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type TestimonialItem = {
  id: string;
  /** The words of the customer, without quotation marks. */
  quote: string;
  /** "Familie K., Einfamilienhaus" */
  author: string;
};

export type TestimonialsContent = {
  items: TestimonialItem[];
};

/**
 * "Was Kunden sagen", mockup 01i: the quotes in a row, each under a 2px
 * Tannengrün line. The quotation marks come from messages, so each language
 * has its own. As many columns as fit, 280px wide at least.
 */
export function Testimonials({ items }: TestimonialsContent) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="stimmen-titel">
      <Container>
        <SectionHeading id="stimmen-titel" title={t("testimonialsTitle")} />
        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10">
          {items.map((item) => (
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
