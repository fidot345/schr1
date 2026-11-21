import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Process } from "@/components/home/Process";
import { ServiceList } from "@/components/services/ServiceList";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getHomePage, getServices } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /leistungen and /en/services. */
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
  const t = await getTranslations({ locale, namespace: "ServicesPage" });

  return {
    title: t("title"),
    description: t("intro"),
    alternates: pageAlternates(locale, () => "/leistungen"),
  };
}

/**
 * Services, BRIEF.md section 2: a short introduction, the services larger
 * than on the home page, "So läuft Ihr Auftrag" with the request button.
 * The steps are the ones of the home page in Payload.
 */
export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [services, home] = await Promise.all([
    getServices(locale),
    getHomePage(locale),
  ]);

  return (
    <>
      <ServiceList services={services} />
      <Process steps={home.processSteps} />
    </>
  );
}
