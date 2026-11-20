import { useTranslations } from "next-intl";
import type { ServiceCard } from "@/lib/content";
import { Card } from "../Card";
import { Section } from "../Section";

type HomeServicesProps = {
  services: ServiceCard[];
};

/** "Was wir bauen": the services as cards, BRIEF.md section 2. */
export function HomeServices({ services }: HomeServicesProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-services" title={t("servicesTitle")}>
      <ul className="grid gap-12 sm:grid-cols-2 sm:gap-8 xl:grid-cols-4">
        {services.map((service) => (
          <li key={service.id}>
            <Card
              href={{
                pathname: "/leistungen/[slug]",
                params: { slug: service.slug },
              }}
              photo={service.photo}
              title={service.title}
              line={service.summary}
              sizes="(min-width: 80rem) 290px, (min-width: 40rem) 50vw, 100vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
