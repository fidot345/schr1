import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbs } from "@/i18n/json-ld";
import { pageMetadata } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getLegalTexts } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /datenschutz and /en/privacy. */
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
  const [t, { privacy }] = await Promise.all([
    getTranslations({ locale, namespace: "PrivacyPage" }),
    getLegalTexts(locale),
  ]);

  return {
    title: t("title"),
    description: privacy.summary ?? undefined,
    ...(await pageMetadata(locale, () => "/datenschutz")),
  };
}

/**
 * Datenschutz, BRIEF.md section 2: what the site really does (hosting,
 * forms sent by e-mail, no cookies, no counting), as written in
 * SiteSettings ("Rechtliches").
 */
export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, { privacy }, trail] = await Promise.all([
    getTranslations({ locale, namespace: "PrivacyPage" }),
    getLegalTexts(locale),
    breadcrumbs(locale, "/datenschutz"),
  ]);

  return (
    <>
      <JsonLd data={trail} />
      <LegalPage
        titleId="datenschutz-titel"
        title={t("heading")}
        body={privacy.body}
      />
    </>
  );
}
