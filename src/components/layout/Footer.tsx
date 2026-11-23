import { useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { TextLink } from "@/components/ui/TextLink";
import type { CompanyData, OpeningHoursRow } from "@/lib/content";
import { telHref } from "@/lib/phone";
import { addressLines } from "@/lib/text";
import { LEGAL_NAVIGATION, MAIN_NAVIGATION } from "./navigation";

type FooterProps = {
  company: CompanyData;
  openingHours: OpeningHoursRow[];
  /** The line under the logo, from SiteSettings; none when it is empty. */
  tagline: string | null;
};

const HEADING_CLASS = "font-sans text-small font-bold text-weiss";

/*
 * Links on Graphit: Moos, and Weiß on hover (the base hover color is too dark
 * here). inline-block makes each link as high as its line, 28.8px, so it is
 * a target of at least 24px (WCAG 2.5.8) and the lines stay where they are.
 */
const LINK_CLASS = "inline-block text-moos hover:text-weiss";

/*
 * The lists of the footer have a line height of 1.8, as in the mockup (01k),
 * not the 1.5 of the text scale: with it the columns come out 20px shorter.
 */
const LIST_CLASS = "mt-3 leading-[1.8]";

/**
 * The footer on Graphit, mockup 01k: the logo with a line of text, the
 * contact, the opening hours, the pages, and under a Schiefer line the
 * concept note and the legal pages. focus-ring-light turns the focus ring of
 * everything inside to Weiß.
 */
export function Footer({ company, openingHours, tagline }: FooterProps) {
  const t = useTranslations("Footer");
  const tNavigation = useTranslations("Navigation");
  const tDemo = useTranslations("Demo");
  const tel = telHref(company.phone);

  // Each line only when SiteSettings has it; no lines, no column.
  const contactLines: { key: string; content: ReactNode }[] = [
    ...(tel && company.phone
      ? [
          {
            key: "phone",
            content: (
              <TextLink href={tel} tone="plain" className={LINK_CLASS}>
                {company.phone}
              </TextLink>
            ),
          },
        ]
      : []),
    ...(company.email
      ? [
          {
            key: "email",
            content: (
              <TextLink
                href={`mailto:${company.email}`}
                tone="plain"
                className={LINK_CLASS}
              >
                {company.email}
              </TextLink>
            ),
          },
        ]
      : []),
    ...addressLines(company).map((line, index) => ({
      key: `address-${index}`,
      content: line,
    })),
  ];

  return (
    <footer className="focus-ring-light bg-graphit pt-16 pb-8 text-small text-moos">
      <Container>
        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <div className="min-w-0 flex-[2_1_240px]">
            <Logo variant="light" name={company.logoWord} />
            {tagline ? <p className="mt-4 max-w-[22em]">{tagline}</p> : null}
          </div>

          {contactLines.length > 0 ? (
            <div className="flex-[1_1_180px]">
              <h2 className={HEADING_CLASS}>{t("contactHeading")}</h2>
              <address className={`${LIST_CLASS} not-italic`}>
                {contactLines.map((line, index) => (
                  <Fragment key={line.key}>
                    {index > 0 ? <br /> : null}
                    {line.content}
                  </Fragment>
                ))}
              </address>
            </div>
          ) : null}

          {openingHours.length > 0 ? (
            <div className="flex-[1_1_180px]">
              <h2 className={HEADING_CLASS}>{t("hoursHeading")}</h2>
              <ul className={LIST_CLASS}>
                {openingHours.map((row) => (
                  <li key={row.id}>
                    {t("hours", { days: row.days, hours: row.hours })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav aria-labelledby="footer-pages" className="flex-[1_1_160px]">
            <h2 id="footer-pages" className={HEADING_CLASS}>
              {t("pagesHeading")}
            </h2>
            <ul className={LIST_CLASS}>
              {MAIN_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <TextLink
                    href={item.href}
                    tone="plain"
                    className={LINK_CLASS}
                  >
                    {tNavigation(item.label)}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap justify-between gap-4 border-t border-schiefer pt-6 text-xs">
          <p className="text-linie">{tDemo("notice")}</p>
          <nav aria-label={t("legalHeading")}>
            <ul className="flex gap-6">
              {LEGAL_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <TextLink
                    href={item.href}
                    tone="plain"
                    className={LINK_CLASS}
                  >
                    {tNavigation(item.label)}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
