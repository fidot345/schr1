import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import type { ContactDetails as ContactDetailsData } from "@/lib/content";
import { telHref } from "@/lib/phone";

type ContactDetailsProps = ContactDetailsData;

/**
 * /kontakt, BRIEF.md section 2, laid out like "Sprechen Sie mit uns" (01j)
 * on the home page: on the left the h1, the phone number at the top of the
 * scale, the e-mail and the address; on the right the opening hours, where
 * we work and the request button. No map: the town is fictional. The page
 * has no mobile action bar, so the button is here.
 */
export function ContactDetails({
  company,
  openingHours,
  serviceArea,
}: ContactDetailsProps) {
  const t = useTranslations("ContactPage");

  return (
    <Section
      labelledBy="kontakt-titel"
      topSpace="none"
      className="pt-10 pb-16 md:pt-14 md:pb-32"
    >
      <Container className="flex flex-wrap gap-14">
        <div className="min-w-0 flex-[6_1_400px]">
          <h1 id="kontakt-titel" className="font-display text-h1">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-[34em] text-lead">{t("intro")}</p>
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
            {company.name}
            <br />
            {company.street}
            <br />
            {company.postalCode} {company.city}
          </address>
        </div>

        <div className="min-w-0 flex-[5_1_320px]">
          <h2 className="font-display text-h4">{t("hoursTitle")}</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {openingHours.map((row) => (
              <Fragment key={row.id}>
                <dt className="font-bold">{row.days}</dt>
                <dd>{t("hours", { hours: row.hours })}</dd>
              </Fragment>
            ))}
          </dl>
          {serviceArea.length > 0 ? (
            <>
              <h2 className="mt-10 font-display text-h4">{t("areaTitle")}</h2>
              {serviceArea.map((paragraph) => (
                <p key={paragraph} className="mt-4 max-w-[34em]">
                  {paragraph}
                </p>
              ))}
            </>
          ) : null}
          <ButtonLink href="/anfrage" className="mt-8 w-full md:w-auto">
            {t("requestCta")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
