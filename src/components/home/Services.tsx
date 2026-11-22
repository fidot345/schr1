import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ServiceCard } from "@/lib/content";

type ServicesProps = {
  /** The services from the admin panel, in its order. */
  services: ServiceCard[];
};

/**
 * "Was wir bauen", mockup 01c: a row of cards, each a 4:3 photo, a title and
 * the service's one line; the whole card is the link to the service. As
 * many columns as fit, 240px wide at least.
 */
export function Services({ services }: ServicesProps) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="leistungen-titel">
      <Container>
        <SectionHeading
          id="leistungen-titel"
          title={t("servicesTitle")}
          intro={t("servicesIntro")}
        />
        <ul className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
          {services.map((service) => (
            <li key={service.id}>
              <AppLink
                href={{
                  pathname: "/leistungen/[slug]",
                  params: { slug: service.slug },
                }}
                className="group flex flex-col gap-4 text-graphit no-underline"
              >
                <CmsImage
                  photo={service.photo}
                  frameClassName="aspect-4/3"
                  sizes="(min-width: 80rem) 280px, (min-width: 64rem) 30vw, (min-width: 36rem) 50vw, 100vw"
                />
                <div>
                  <h3 className="font-display text-h3 group-hover:text-tannengruen-dunkel group-hover:underline">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-ui text-schiefer">
                    {service.summary}
                  </p>
                </div>
              </AppLink>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
