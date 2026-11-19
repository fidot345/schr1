import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { TextLink } from "@/components/ui/TextLink";
import { telHref } from "@/lib/phone";
import { LEGAL_NAVIGATION, MAIN_NAVIGATION } from "./navigation";

/** Company data from the SiteSettings global in Payload (stage 2). */
export type CompanyContact = {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  /** As people write it: "089 99998 412". */
  phone: string;
  email: string;
};

export type OpeningHoursEntry = {
  /** "Mo–Do" */
  days: string;
  /** "7:00–16:30" */
  hours: string;
};

type FooterProps = {
  company: CompanyContact;
  openingHours: OpeningHoursEntry[];
};

/**
 * Site footer on Graphit, BRIEF.md section 3. focus-ring-light turns the
 * focus ring of everything inside to Weiß.
 */
export function Footer({ company, openingHours }: FooterProps) {
  const t = useTranslations("Footer");
  const tNavigation = useTranslations("Navigation");
  const tDemo = useTranslations("Demo");

  return (
    <footer className="focus-ring-light bg-graphit text-papier">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <section aria-labelledby="footer-contact" className="md:col-span-4">
            <Heading level={2} size={4} id="footer-contact">
              {t("contactHeading")}
            </Heading>
            <address className="mt-4 not-italic">
              <p className="font-bold">{company.name}</p>
              <p>{company.street}</p>
              <p>
                {company.postalCode} {company.city}
              </p>
              <dl className="mt-4 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <dt className="font-bold">{t("phone")}</dt>
                  <dd>
                    <TextLink href={telHref(company.phone)} tone="light">
                      {company.phone}
                    </TextLink>
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="font-bold">{t("email")}</dt>
                  <dd>
                    <TextLink href={`mailto:${company.email}`} tone="light">
                      {company.email}
                    </TextLink>
                  </dd>
                </div>
              </dl>
            </address>
          </section>

          <section aria-labelledby="footer-hours" className="md:col-span-4">
            <Heading level={2} size={4} id="footer-hours">
              {t("hoursHeading")}
            </Heading>
            <dl className="mt-4 flex flex-col gap-2">
              {openingHours.map((entry) => (
                <div key={entry.days} className="flex flex-wrap gap-4">
                  <dt className="w-24 font-bold">{entry.days}</dt>
                  <dd>{entry.hours}</dd>
                </div>
              ))}
            </dl>
          </section>

          <nav aria-labelledby="footer-menu" className="md:col-span-4">
            <Heading level={2} size={4} id="footer-menu">
              {t("menuHeading")}
            </Heading>
            <ul className="mt-4 flex flex-col gap-2">
              {MAIN_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href} tone="light">
                    {tNavigation(item.label)}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-schiefer pt-8 md:flex-row md:justify-between">
          <nav aria-label={t("legalHeading")}>
            <ul className="flex flex-wrap gap-6">
              {LEGAL_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href} tone="light">
                    {tNavigation(item.label)}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-small">{tDemo("notice")}</p>
        </div>
      </Container>
    </footer>
  );
}
