import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getHomePage } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: / and /en. */
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
  const { hero, meta } = await getHomePage(locale);

  return {
    // The SEO title from the admin panel already names the company, so it
    // skips the "| Schreinerei Tannrieder" template; without it, the hero
    // title goes through the template.
    title: meta.title ? { absolute: meta.title } : hero.title,
    description: meta.description ?? hero.text,
    alternates: pageAlternates(locale, () => "/"),
  };
}

/**
 * Only the h1 is left of the old home page. The sections come back in
 * redesign sessions 4 and 5, from the mockup in design/.
 */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const { hero } = await getHomePage(locale);

  return <h1>{hero.title}</h1>;
}
