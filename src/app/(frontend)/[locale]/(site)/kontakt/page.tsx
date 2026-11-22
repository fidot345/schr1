import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { pageMetadata } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getContactDetails } from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Built ahead for both languages: /kontakt and /en/contact. */
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
  const [t, { company }] = await Promise.all([
    getTranslations({ locale, namespace: "ContactPage" }),
    getContactDetails(locale),
  ]);

  return {
    title: t("title"),
    description: t("description", {
      phone: company.phone,
      email: company.email,
      street: company.street,
      postalCode: company.postalCode,
      city: company.city,
    }),
    ...(await pageMetadata(locale, () => "/kontakt")),
  };
}

/**
 * Contact, BRIEF.md section 2: phone, e-mail, address, opening hours and
 * where we work, all from SiteSettings in Payload. The contact form is not
 * part of the brief; requests go through /anfrage.
 */
export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const contact = await getContactDetails(locale);

  return <ContactDetails {...contact} />;
}
