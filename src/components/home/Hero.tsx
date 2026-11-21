import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  PhotoPlaceholder,
  type PlaceholderPhoto,
} from "@/components/ui/PhotoPlaceholder";
import { Section } from "@/components/ui/Section";

/** One line under the buttons: "<strong>Meisterbetrieb</strong> seit 1989". */
export type HeroFact = { strong: string; rest: string };

export type HeroContent = {
  /** The h1 of the page. */
  title: string;
  text: string;
  photo: PlaceholderPhoto;
  facts: HeroFact[];
};

/**
 * The first screen, mockup 01b and 04. From lg the text is on the left and
 * the photo on the right, bottom edges level. Below lg everything is one
 * column with the photo first; on the phone it runs edge to edge without
 * rounding, right under the header.
 */
export function Hero({ title, text, photo, facts }: HeroContent) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="hero-titel" topSpace="none" className="md:pt-14">
      <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-12">
        <div className="min-w-0 max-w-135 lg:flex-[1_1_400px] lg:pb-2">
          <h1 id="hero-titel" className="font-display text-display">
            {title}
          </h1>
          <p className="mt-3.5 text-lead md:mt-6">{text}</p>
          <div className="mt-5.5 flex flex-col gap-3 md:mt-9 md:flex-row md:gap-4">
            <ButtonLink href="/anfrage" className="w-full md:w-auto">
              {t("requestCta")}
            </ButtonLink>
            <ButtonLink
              href="/karriere"
              variant="secondary"
              className="w-full md:w-auto"
            >
              {t("jobsCta")}
            </ButtonLink>
          </div>
        </div>
        <PhotoPlaceholder
          photo={photo}
          className="-mx-gutter order-first h-67.5 min-w-0 rounded-none md:mx-0 md:rounded lg:order-none lg:h-140 lg:flex-[1.4_1_520px]"
        />
      </Container>

      <Container className="mt-10">
        <ul className="flex flex-wrap gap-x-14 gap-y-4 border-t border-linie pt-6 text-ui text-schiefer">
          {facts.map((fact) => (
            <li key={fact.strong}>
              <strong className="font-bold text-graphit">{fact.strong}</strong>{" "}
              {fact.rest}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
