import { useTranslations } from "next-intl";
import type { AppHref } from "@/components/ui/AppLink";
import { AppLink } from "@/components/ui/AppLink";
import { Container } from "@/components/ui/Container";
import {
  PhotoPlaceholder,
  type PlaceholderPhoto,
} from "@/components/ui/PhotoPlaceholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type ServiceItem = {
  id: string;
  title: string;
  text: string;
  photo: PlaceholderPhoto;
  href: AppHref;
};

export type ServicesContent = {
  /** The sentence under the heading. */
  intro: string;
  items: ServiceItem[];
};

/**
 * "Was wir bauen", mockup 01c: a row of cards, each a photo, a title and a
 * line of text; the whole card is the link. As many columns as fit, 240px
 * wide at least.
 */
export function Services({ intro, items }: ServicesContent) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="leistungen-titel">
      <Container>
        <SectionHeading
          id="leistungen-titel"
          title={t("servicesTitle")}
          intro={intro}
        />
        <ul className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
          {items.map((item) => (
            <li key={item.id}>
              <AppLink
                href={item.href}
                className="group flex flex-col gap-4 text-graphit no-underline"
              >
                <PhotoPlaceholder photo={item.photo} className="aspect-4/3" />
                <div>
                  <h3 className="font-display text-h3 group-hover:text-tannengruen-dunkel group-hover:underline">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-ui text-schiefer">{item.text}</p>
                </div>
              </AppLink>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
