"use client";

/*
 * Client component because only the browser side knows the current route:
 * a layout gets no pathname, and usePathname / useParams are client hooks.
 */

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";
import {
  type Href,
  isSlugPathname,
  localeSwitchHref,
  type SlugTranslations,
} from "@/i18n/locale-switch-href";
import { Link } from "@/i18n/navigation";
import { useRoutePathname } from "@/i18n/route-pathname";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type LocaleSwitcherProps = {
  /**
   * The same page in the other language, for pages whose slug is
   * translated (from Payload). Without it the current route is reused.
   */
  alternateHref?: Href;
  /**
   * Translated slugs from Payload, see getSlugTranslations: the switch on
   * /leistungen/kuechen links to /en/services/kitchens.
   */
  translatedSlugs?: SlugTranslations;
  /**
   * The navigation's name for screen readers, "Sprache" when left out.
   * Two switchers shown at once need different names.
   */
  label?: string;
  className?: string;
};

/**
 * DE | EN as in the mockup (01a): 16px, the current language bold and
 * Graphit, the other one a Schiefer link, a Linie bar between them.
 * The current language is plain text, the other one a link. The link's name
 * starts with what it shows ("EN – English"), so voice control finds it by
 * "EN" too (WCAG 2.5.3).
 */
export function LocaleSwitcher({
  alternateHref,
  translatedSlugs,
  label,
  className,
}: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = useRoutePathname();
  const params = useParams();
  const hrefFor = (code: (typeof routing.locales)[number]): Href => {
    if (alternateHref) return alternateHref;
    const slugMap = isSlugPathname(pathname)
      ? translatedSlugs?.[pathname]?.[code]
      : undefined;
    return localeSwitchHref(pathname, params, slugMap);
  };

  return (
    <nav
      aria-label={label ?? t("label")}
      className={cn("flex items-center gap-2 text-small", className)}
    >
      {routing.locales.map((code, index) => (
        <Fragment key={code}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-linie">
              |
            </span>
          ) : null}
          {code === locale ? (
            <span
              lang={code}
              aria-current="true"
              className="py-3 font-bold text-graphit"
            >
              <span aria-hidden="true">{t(`short.${code}`)}</span>
              <span className="sr-only">{t(`name.${code}`)}</span>
            </span>
          ) : (
            <Link
              href={hrefFor(code)}
              locale={code}
              lang={code}
              hrefLang={code}
              aria-label={t("linkLabel", {
                short: t(`short.${code}`),
                name: t(`name.${code}`),
              })}
              className="py-3 text-schiefer no-underline hover:text-tannengruen-dunkel hover:underline"
            >
              {t(`short.${code}`)}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
