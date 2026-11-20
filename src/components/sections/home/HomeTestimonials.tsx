import { useTranslations } from "next-intl";
import type { TestimonialItem } from "@/lib/content";
import { Section } from "../Section";

type HomeTestimonialsProps = {
  testimonials: TestimonialItem[];
};

/** "Kundenstimmen": three short quotes from the admin panel, BRIEF.md section 2. */
export function HomeTestimonials({ testimonials }: HomeTestimonialsProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-testimonials" title={t("testimonialsTitle")}>
      <ul className="grid gap-8 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <li key={testimonial.id}>
            <figure className="flex h-full flex-col gap-4 border-l-2 border-tannengruen pl-6">
              <blockquote className="max-w-measure text-lead">
                <p>{testimonial.quote}</p>
              </blockquote>
              <figcaption className="text-schiefer">
                {testimonial.author}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
