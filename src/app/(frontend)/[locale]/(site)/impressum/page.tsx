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

/** Built ahead for both languages: /impressum and /en/imprint. */
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
  const [t, { imprint }] = await Promise.all([
    getTranslations({ locale, namespace: "ImprintPage" }),
    getLegalTexts(locale),
  ]);

  return {
    title: t("title"),
    description: imprint.summary ?? undefined,
    ...(await pageMetadata(locale, () => "/impressum")),
  };
}

/**
 * Impressum, BRIEF.md section 2: the concept note first, then the text from
 * SiteSettings ("Rechtliches"). No register or tax numbers: the text in the
 * admin panel says so itself.
 */
export default async function ImprintPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, { imprint }, trail] = await Promise.all([
    getTranslations({ locale, namespace: "ImprintPage" }),
    getLegalTexts(locale),
    breadcrumbs(locale, "/impressum"),
  ]);

  return (
    <>
      <JsonLd data={trail} />
      <LegalPage
        titleId="impressum-titel"
        title={t("title")}
        body={imprint.body}
        conceptNote
      />
    </>
  );
}
