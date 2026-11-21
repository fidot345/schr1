import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RequestCta } from "@/components/sections/RequestCta";
import { ServiceDetails } from "@/components/sections/services/ServiceDetails";
import { ServiceGallery } from "@/components/sections/services/ServiceGallery";
import { ServiceHero } from "@/components/sections/services/ServiceHero";
import { ServiceProjects } from "@/components/sections/services/ServiceProjects";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getService, getServices } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Every service in both languages, with the slug of that language:
 * /leistungen/kuechen and /en/services/kitchens. A service added later is
 * built on its first visit; an unknown slug gives 404.
 */
export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) {
    return [];
  }
  const services = await getServices(locale);
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const service = await getService(locale, slug);
  if (!service) {
    return {};
  }

  return {
    // An SEO title from the admin panel names the company itself, see the
    // home page; otherwise the service title goes through the template.
    title: service.meta.title
      ? { absolute: service.meta.title }
      : service.title,
    description: service.meta.description ?? service.summary,
    alternates: pageAlternates(locale, (code) => ({
      pathname: "/leistungen/[slug]",
      params: { slug: service.slugs[code] },
    })),
  };
}

/**
 * A service, BRIEF.md section 2: title and introduction, what is included,
 * the materials, how long it takes, photos, projects of this type and the
 * request button.
 */
export default async function ServicePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [service, t] = await Promise.all([
    getService(locale, slug),
    getTranslations({ locale, namespace: "ServicePage" }),
  ]);
  if (!service) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-section-large">
      <ServiceHero
        title={service.title}
        intro={service.intro}
        photo={service.photo}
      />
      <ServiceDetails
        included={service.included}
        materials={service.materials}
        duration={service.duration}
      />
      <ServiceGallery photos={service.gallery} />
      <div className="flex flex-col gap-12">
        <ServiceProjects projects={service.projects} />
        <Container>
          <p>
            <TextLink href="/leistungen">{t("allServices")}</TextLink>
          </p>
        </Container>
      </div>
      <RequestCta id="service-request" />
    </div>
  );
}
