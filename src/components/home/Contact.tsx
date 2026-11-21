import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import type { CompanyData } from "@/lib/content";
import { telHref } from "@/lib/phone";

export type ContactHoursRow = {
  id: string;
  /** "Montag bis Donnerstag" */
  days: string;
  /** "7:00–16:30 Uhr", or "geschlossen" when closed is set. */
  hours: string;
  closed?: boolean;
};

export type ContactContent = {
  /** The sentence under the heading. */
  intro: string;
  hours: ContactHoursRow[];
  /** The line under the hours: how far the team travels. */
  note: string;
};

type ContactProps = ContactContent & {
  /** Phone, e-mail and address of the firm. */
  company: CompanyData;
};

/**
 * "Sprechen Sie mit uns", mockup 01j: a white band with a line on top. On the
 * left the intro, the phone number at the top of the scale, the e-mail and
 * the address; on the right the opening hours, the radius of work and the
 * request button.
 */
export function Contact({ intro, hours, note, company }: ContactProps) {
  const t = useTranslations("HomePage");

  return (
    <Section variant="line" labelledBy="kontakt-titel">
      <Container className="flex flex-wrap gap-14">
        <div className="min-w-0 flex-[6_1_400px]">
          <h2 id="kontakt-titel" className="font-display text-h2">
            {t("contactTitle")}
          </h2>
          <p className="mt-4 max-w-[32em]">{intro}</p>
          <TextLink
            href={telHref(company.phone)}
            tone="plain"
            className="mt-7 inline-block font-display text-tel-lg text-tannengruen no-underline"
          >
            {company.phone}
          </TextLink>
          <p className="mt-3">
            <TextLink href={`mailto:${company.email}`} tone="plain">
              {company.email}
            </TextLink>
          </p>
          <address className="mt-5 text-schiefer not-italic">
            {company.street}
            <br />
            {company.postalCode} {company.city}
          </address>
        </div>

        <div className="min-w-0 flex-[5_1_320px]">
          <h3 className="font-display text-h4">{t("contactHours")}</h3>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {hours.map((row) => (
              <Fragment key={row.id}>
                <dt className="font-bold">{row.days}</dt>
                <dd className={row.closed ? "text-schiefer" : undefined}>
                  {row.hours}
                </dd>
              </Fragment>
            ))}
          </dl>
          <p className="mt-6 text-schiefer">{note}</p>
          <ButtonLink href="/anfrage" className="mt-7 w-full md:w-auto">
            {t("requestCta")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
