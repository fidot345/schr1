import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { TextLink } from "@/components/ui/TextLink";
import type { SiteContent } from "@/lib/content";
import { telHref } from "@/lib/phone";
import { Section } from "../Section";

type HomeContactProps = {
  site: SiteContent;
};

/**
 * Contact block at the end of the home page, BRIEF.md section 2: the phone
 * number large, email, address, opening hours and the request button.
 * Everything from SiteSettings.
 */
export function HomeContact({ site }: HomeContactProps) {
  const t = useTranslations("HomePage");
  const { company, openingHours } = site;

  return (
    <Section id="home-contact" title={t("contactTitle")} tone="moos">
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-2 xl:col-span-6">
          <div className="flex flex-col gap-1">
            <Heading level={3} size={4}>
              {t("contactPhone")}
            </Heading>
            <a
              href={telHref(company.phone)}
              className="w-fit font-heading text-h2 font-semibold text-tannengruen underline underline-offset-4 hover:text-tannengruen-dunkel hover:decoration-2 motion-safe:transition-colors"
            >
              {company.phone}
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <Heading level={3} size={4}>
              {t("contactEmail")}
            </Heading>
            <p>
              <TextLink href={`mailto:${company.email}`}>
                {company.email}
              </TextLink>
            </p>
          </div>
          <div>
            <Button href="/anfrage">{t("requestCta")}</Button>
          </div>
        </div>

        <div className="flex flex-col gap-1 xl:col-span-3">
          <Heading level={3} size={4}>
            {t("contactAddress")}
          </Heading>
          <address className="not-italic">
            <p>{company.name}</p>
            <p>{company.street}</p>
            <p>
              {company.postalCode} {company.city}
            </p>
          </address>
        </div>

        <div className="flex flex-col gap-1 xl:col-span-3">
          <Heading level={3} size={4}>
            {t("contactHours")}
          </Heading>
          <dl className="flex flex-col gap-1">
            {openingHours.map((row) => (
              <div key={row.id} className="flex flex-wrap gap-x-4">
                <dt className="w-24 font-bold">{row.days}</dt>
                <dd>{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
