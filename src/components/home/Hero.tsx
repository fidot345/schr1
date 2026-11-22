import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { HomeContent } from "@/lib/content";

type HeroProps = HomeContent["hero"];

/**
 * The first screen, mockup 01b and 04. From lg the text is on the left and
 * the photo on the right, bottom edges level. Below lg everything is one
 * column with the photo first; on the phone it runs edge to edge without
 * rounding, right under the header. The photo is the page's largest image
 * (LCP), so it loads first. Without facts in the admin panel the line of
 * facts under it falls away.
 */
export function Hero({ title, text, photo, facts }: HeroProps) {
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
        <CmsImage
          photo={photo}
          frameClassName="-mx-gutter order-first h-67.5 min-w-0 max-md:rounded-none md:mx-0 lg:order-none lg:h-140 lg:flex-[1.4_1_520px]"
          sizes="(min-width: 80rem) 700px, (min-width: 64rem) 58vw, 100vw"
          priority
        />
      </Container>

      {facts.length > 0 ? (
        <Container className="mt-10">
          <ul className="flex flex-wrap gap-x-14 gap-y-4 border-t border-linie pt-6 text-ui text-schiefer">
            {facts.map((fact) => (
              <li key={fact.id}>
                <strong className="font-bold text-graphit">
                  {fact.highlight}
                </strong>{" "}
                {fact.text}
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </Section>
  );
}
