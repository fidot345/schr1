import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import type { CompanyData, OpeningHoursRow } from "@/lib/content";
import { telHref } from "@/lib/phone";
import { addressLines } from "@/lib/text";

type ContactProps = {
  /** Phone, e-mail and address of the firm, from SiteSettings. */
  company: CompanyData;
  openingHours: OpeningHoursRow[];
  /** "Wo wir arbeiten" from SiteSettings, in paragraphs. */
  serviceArea: string[];
};

/**
 * "Sprechen Sie mit uns", mockup 01j: a white band with a line on top. On the
 * left the intro, the phone number at the top of the scale, the e-mail and
 * the address; on the right the opening hours, the area of work and the
 * request button.
 */
export function Contact({ company, openingHours, serviceArea }: ContactProps) {
  const t = useTranslations("HomePage");
  const tel = telHref(company.phone);
  // Missing parts are left out; with none, there is no address at all.
  const address = addressLines(company);

  return (
    <Section variant="line" labelledBy="kontakt-titel">
      <Container className="flex flex-wrap gap-14">
        <div className="min-w-0 flex-[6_1_400px]">
          <h2 id="kontakt-titel" className="font-display text-h2">
            {t("contactTitle")}
          </h2>
          <p className="mt-4 max-w-[32em]">{t("contactIntro")}</p>
          {tel && company.phone ? (
            <TextLink
              href={tel}
              tone="plain"
              className="mt-7 inline-block font-display text-tel-lg text-tannengruen no-underline"
            >
              {company.phone}
            </TextLink>
          ) : null}
          {company.email ? (
            <p className="mt-3">
              <TextLink href={`mailto:${company.email}`} tone="plain">
                {company.email}
              </TextLink>
            </p>
          ) : null}
          {address.length > 0 ? (
            <address className="mt-5 text-schiefer not-italic">
              {address.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </address>
          ) : null}
        </div>

        <div className="min-w-0 flex-[5_1_320px]">
          {openingHours.length > 0 ? (
            <>
              <h3 className="font-display text-h4">{t("contactHours")}</h3>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                {openingHours.map((row) => (
                  <Fragment key={row.id}>
                    <dt className="font-bold">{row.days}</dt>
                    <dd>{t("hours", { hours: row.hours })}</dd>
                  </Fragment>
                ))}
              </dl>
            </>
          ) : null}
          {serviceArea.map((paragraph) => (
            <p key={paragraph} className="mt-6 max-w-[34em] text-schiefer">
              {paragraph}
            </p>
          ))}
          <ButtonLink href="/anfrage" className="mt-7 w-full md:w-auto">
            {t("requestCta")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
