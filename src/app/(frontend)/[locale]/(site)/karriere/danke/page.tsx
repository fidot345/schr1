import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextSteps } from "@/components/form/NextSteps";
import { ButtonLink } from "@/components/ui/Button";
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

/** Built ahead for both languages: /karriere/danke and /en/careers/thank-you. */
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
  const t = await getTranslations({ locale, namespace: "CareersThanksPage" });

  return {
    title: t("metaTitle"),
    // Only reached by sending the form: nothing for a search engine.
    robots: { index: false, follow: true },
    ...(await pageMetadata(locale, () => "/karriere/danke")),
  };
}

/**
 * After an application, BRIEF.md section 5 "Formen", in the shape of the
 * request's thank-you page and with "du" as on all careers pages: that it
 * arrived, what happens next, the phone number for what was forgotten, and
 * the way on.
 */
export default async function CareersThanksPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, steps, { company }] = await Promise.all([
    getTranslations({ locale, namespace: "CareersThanksPage" }),
    getTranslations({ locale, namespace: "ApplicationForm.nextSteps" }),
    getSiteSettings(locale),
  ]);
  const tel = telHref(company.phone);

  return (
    <Section
      labelledBy="danke-titel"
      topSpace="none"
      className="pt-10 pb-16 md:pt-14 md:pb-32"
    >
      <Container className="flex flex-wrap items-start gap-14">
        <div className="min-w-0 flex-[7_1_480px]">
          <h1 id="danke-titel" className="font-display text-h1">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-[34em] text-lead">{t("text")}</p>
          {tel && company.phone ? (
            <p className="mt-4 max-w-[34em]">
              {t.rich("call", {
                phone: company.phone,
                link: (chunks) => <TextLink href={tel}>{chunks}</TextLink>,
              })}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
            <ButtonLink href="/" className="w-full md:w-auto">
              {t("home")}
            </ButtonLink>
            <TextLink href="/ueber-uns">{t("team")}</TextLink>
          </div>
        </div>
        <aside
          aria-labelledby="danke-danach"
          className="min-w-0 flex-[4_1_300px]"
        >
          <NextSteps
            headingId="danke-danach"
            steps={[steps("first"), steps("second"), steps("third")]}
          />
        </aside>
      </Container>
    </Section>
  );
}
