import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CallBox } from "@/components/form/CallBox";
import { ConceptNote } from "@/components/form/ConceptNote";
import { NextSteps } from "@/components/form/NextSteps";
import { RequestForm } from "@/components/request/RequestForm";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { pageMetadata } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/content";
import { telHref } from "@/lib/phone";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /anfrage and /en/request. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "RequestPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...(await pageMetadata(locale, () => "/anfrage")),
  };
}

/**
 * The request, BRIEF.md section 2 and mockup 03: the form in three steps,
 * beside it (below it on the phone) what happens next and the phone number.
 * The page stays static: ?typ= is read in the browser. Without JavaScript
 * the form cannot go through its steps, so a note gives the phone number.
 */
export default async function RequestPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, { company, openingHours }] = await Promise.all([
    getTranslations({ locale, namespace: "RequestPage" }),
    getSiteSettings(locale),
  ]);
  const tel = telHref(company.phone);

  return (
    <Section
      labelledBy="anfrage-titel"
      topSpace="none"
      className="pt-10 pb-16 md:pt-14 md:pb-24"
    >
      <Container>
        <h1 id="anfrage-titel" className="font-display text-h1">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-[34em] text-lead">{t("lead")}</p>
        <noscript>
          <p className="mt-6 max-w-[34em] rounded bg-moos px-6 py-5 font-bold">
            {tel && company.phone
              ? t.rich("noscript", {
                  phone: company.phone,
                  link: (chunks) => <TextLink href={tel}>{chunks}</TextLink>,
                })
              : t.rich("noscriptNoPhone", {
                  link: (chunks) => (
                    <TextLink href="/kontakt">{chunks}</TextLink>
                  ),
                })}
          </p>
        </noscript>

        <div className="mt-10 flex flex-wrap items-start gap-14">
          <div className="min-w-0 flex-[7_1_560px]">
            <RequestForm phone={company.phone} />
            <ConceptNote className="mt-4" />
          </div>
          <aside
            aria-labelledby="anfrage-danach"
            className="min-w-0 flex-[4_1_300px]"
          >
            <NextSteps
              headingId="anfrage-danach"
              steps={[
                t("nextSteps.first"),
                t("nextSteps.second"),
                t("nextSteps.third"),
              ]}
            />
            <CallBox
              className="mt-9"
              phone={company.phone}
              openingHours={openingHours}
            />
          </aside>
        </div>
      </Container>
    </Section>
  );
}
