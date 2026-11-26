import { getTranslations } from "next-intl/server";
import { previewPath } from "@/lib/preview";
import { absoluteUrl } from "@/lib/seo";
import {
  buildBreadcrumbList,
  buildLocalBusiness,
  type LocalBusinessSource,
} from "@/lib/structured-data";
import { getPathname } from "./navigation";
import type { PathHref } from "./page-paths";
import type { Locale } from "./routing";

/*
 * The Google markup of the pages in their language, with absolute URLs
 * (NEXT_PUBLIC_SITE_URL). The builders are in src/lib/structured-data.ts.
 */

const pageUrl = (locale: Locale, href: PathHref): string =>
  absoluteUrl(getPathname({ locale, href }));

/** The workshop on the home and contact pages; null without a company name. */
export const localBusiness = (locale: Locale, contact: LocalBusinessSource) =>
  buildLocalBusiness(contact, {
    url: pageUrl(locale, "/"),
    image: absoluteUrl(previewPath.site(locale)),
  });

/** The pages under the home page, each named by its own title. */
const SECTIONS = {
  "/leistungen": "ServicesPage.title",
  "/referenzen": "ProjectsPage.title",
  "/ueber-uns": "AboutPage.title",
  "/karriere": "CareersPage.title",
  "/anfrage": "RequestPage.title",
  "/kontakt": "ContactPage.title",
  "/impressum": "ImprintPage.title",
  "/datenschutz": "PrivacyPage.title",
} as const;

export type Section = keyof typeof SECTIONS;

/**
 * The BreadcrumbList of an inner page: the home page, the section and, on
 * a service, project or job, the page itself with its title from Payload.
 */
export async function breadcrumbs(
  locale: Locale,
  section: Section,
  page?: { name: string; href: PathHref },
) {
  const t = await getTranslations({ locale });
  const trail = [
    { name: t("Breadcrumbs.home"), href: "/" as const },
    { name: t(SECTIONS[section]), href: section },
    ...(page ? [page] : []),
  ];

  return buildBreadcrumbList(
    trail.map(({ name, href }) => ({ name, url: pageUrl(locale, href) })),
  );
}
