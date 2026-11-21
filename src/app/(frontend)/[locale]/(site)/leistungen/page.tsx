import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/sections/Card";
import { PageIntro } from "@/components/sections/PageIntro";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { RequestCta } from "@/components/sections/RequestCta";
import { Container } from "@/components/ui/Container";
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
 * than on the home page, "So läuft Ihr Auftrag" and the request button.
 */
export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, services, home] = await Promise.all([
    getTranslations({ locale, namespace: "ServicesPage" }),
    getServices(locale),
    getHomePage(locale),
  ]);

  return (
    <div className="flex flex-col gap-section-large">
      <div className="flex flex-col gap-12">
        <PageIntro id="services" title={t("title")} text={t("intro")} />
        <Container>
          <ul className="grid gap-12 md:grid-cols-2 md:gap-8">
            {services.map((service, index) => (
              <li key={service.id}>
                <Card
                  href={{
                    pathname: "/leistungen/[slug]",
                    params: { slug: service.slug },
                  }}
                  photo={service.photo}
                  title={service.title}
                  line={service.summary}
                  headingLevel={2}
                  headingSize={3}
                  sizes="(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 100vw"
                  // On phones the first photo is the largest element on screen.
                  priority={index === 0}
                />
              </li>
            ))}
          </ul>
        </Container>
      </div>
      <ProcessSection id="services-process" steps={home.processSteps} />
      <RequestCta id="services-request" />
    </div>
  );
}
