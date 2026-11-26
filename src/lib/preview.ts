import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getHomePage, getJob, getSiteSettings } from "./content";
import { filled } from "./text";

/*
 * The preview images for messengers and social networks, BRIEF.md
 * section 5: drawn by code in the site's colors by the routes in
 * src/app/(frontend)/[locale]/og, in the language of the page. One image
 * for the site, used by most pages, and one each for the home page and
 * every job. src/i18n/metadata.ts puts them into og:image and twitter:image.
 *
 * Each function below gives an image's path, its alt text and what it
 * shows, so the alt text always says what the image shows.
 */

/** 1200 x 630: the size Open Graph and X's large card show uncropped. */
export const PREVIEW_SIZE = { width: 1200, height: 630 } as const;

export const PREVIEW_TYPE = "image/png";

/** What a preview image shows, drawn by src/lib/preview-image.tsx. */
export type PreviewContent = {
  /** "Schreinerei", small above the logo word, as in the header. */
  descriptor: string;
  /** "Tannrieder" from SiteSettings; without it the row shows only the mark. */
  logoWord: string;
  /** A short label above the title: "Wir stellen ein" on a job. */
  eyebrow?: string | null;
  /** Up to three lines; a longer title ends in an ellipsis. */
  title: string;
  /** Up to two lines under the title. */
  subtitle?: string | null;
};

export type Preview = {
  /** Relative; metadataBase makes it absolute. */
  path: string;
  alt: string;
  content: PreviewContent;
};

/**
 * The paths end in .png, so the proxy (src/proxy.ts) passes them on like
 * any file: next-intl does not redirect /de/… to /….
 */
export const previewPath = {
  site: (locale: Locale) => `/${locale}/og/site.png`,
  home: (locale: Locale) => `/${locale}/og/home.png`,
  job: (locale: Locale, slug: string) =>
    `/${locale}/og/jobs/${encodeURIComponent(slug)}/image.png`,
} as const;

/** The logo row and the texts every image shares. */
const common = async (locale: Locale) => {
  const [{ company, tagline }, t] = await Promise.all([
    getSiteSettings(locale),
    getTranslations({ locale }),
  ]);
  return {
    t,
    tagline,
    siteName: t("Metadata.siteName"),
    logo: {
      descriptor: t("Header.logoDescriptor"),
      logoWord: company.logoWord,
    },
  };
};

/** The site's image: the tagline from SiteSettings, or the site's name without one. */
export async function sitePreview(locale: Locale): Promise<Preview> {
  const { t, tagline, siteName, logo } = await common(locale);

  return {
    path: previewPath.site(locale),
    alt: tagline
      ? t("Preview.alt", { name: siteName, title: tagline })
      : siteName,
    content: { ...logo, title: tagline ?? siteName },
  };
}

/** The home page's image: the title and the text of the first screen. */
export async function homePreview(locale: Locale): Promise<Preview> {
  const [{ t, siteName, logo }, { hero }] = await Promise.all([
    common(locale),
    getHomePage(locale),
  ]);
  const title = filled(hero.title);

  return {
    path: previewPath.home(locale),
    alt: title ? t("Preview.alt", { name: siteName, title }) : siteName,
    content: {
      ...logo,
      title: title ?? siteName,
      subtitle: filled(hero.text),
    },
  };
}

/** A job's image: "Wir stellen ein", the job and its kind and start; null for no open job. */
export async function jobPreview(
  locale: Locale,
  slug: string,
): Promise<Preview | null> {
  const [{ t, siteName, logo }, job] = await Promise.all([
    common(locale),
    getJob(locale, slug),
  ]);
  if (!job) return null;

  return {
    path: previewPath.job(locale, slug),
    alt: t("Preview.jobAlt", { name: siteName, title: job.title }),
    content: {
      ...logo,
      eyebrow: t("Preview.hiring"),
      title: job.title,
      subtitle: [t(`EmploymentType.${job.employmentType}`), filled(job.start)]
        .filter(Boolean)
        .join(" · "),
    },
  };
}
