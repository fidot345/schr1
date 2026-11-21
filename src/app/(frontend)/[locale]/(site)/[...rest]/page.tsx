import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/*
 * The 404 title here too: Next.js sends the 404 as a shell that the browser
 * fills with this route's data, and its title would otherwise be the
 * layout's default.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "NotFoundPage" });
  return { title: t("title") };
}

/**
 * Every address that no page of the site answers, like /gibt-es-nicht or
 * /en/nothing-here, so it gets the 404 of not-found.tsx next to it: in the
 * page's language and with header and footer. Without it Next.js would show
 * its own 404 outside the site's layout.
 */
export default function UnknownPage() {
  notFound();
}
