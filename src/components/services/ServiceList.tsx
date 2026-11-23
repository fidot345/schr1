import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { ServiceCard } from "@/lib/content";

type ServiceListProps = {
  services: ServiceCard[];
};

/**
 * The top of /leistungen, BRIEF.md section 2: the page title, a short
 * introduction and the services, larger than on the home page (01c): two
 * columns from md, each card a photo, a title and one line; the whole card
 * is the link.
 */
export function ServiceList({ services }: ServiceListProps) {
  const t = useTranslations("ServicesPage");

  return (
    <Section
      labelledBy="leistungen-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container>
        <h1 id="leistungen-titel" className="font-display text-h1">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[34em] text-lead">{t("intro")}</p>
        <ul className="mt-12 grid gap-12 md:grid-cols-2 md:gap-8">
          {services.map((service, index) => (
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
                  sizes="(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 100vw"
                  // On the phone the first photo is the largest element on screen.
                  priority={index === 0}
                />
                <div>
                  <h2 className="font-display text-h3 group-hover:text-tannengruen-dunkel group-hover:underline">
                    {service.title}
                  </h2>
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
