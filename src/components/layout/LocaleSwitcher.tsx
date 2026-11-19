"use client";

/*
 * Client component because only the browser side knows the current route:
 * a layout gets no pathname, and usePathname / useParams are client hooks.
 */

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { textLinkClassName } from "@/components/ui/TextLink";
import { type Href, localeSwitchHref } from "@/i18n/locale-switch-href";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type LocaleSwitcherProps = {
  /**
   * The same page in the other language, for pages whose slug is
   * translated (from Payload). Without it the current route is reused.
   */
  alternateHref?: Href;
  /**
   * The navigation's name for screen readers, "Sprache" when left out.
   * Two switchers shown at once need different names.
   */
  label?: string;
  className?: string;
};

/**
 * DE / EN. The current language is plain text, the other one a link.
 * The link's name starts with what it shows ("EN – English"), so voice
 * control finds it by "EN" too (WCAG 2.5.3).
 */
export function LocaleSwitcher({
  alternateHref,
  label,
  className,
}: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const href = alternateHref ?? localeSwitchHref(pathname, params);

  return (
    <nav
      aria-label={label ?? t("label")}
      className={cn("flex items-center gap-2", className)}
    >
      {routing.locales.map((code) =>
        code === locale ? (
          <span
            key={code}
            lang={code}
            aria-current="true"
            className="flex min-h-12 items-center px-2 font-bold text-graphit"
          >
            <span aria-hidden="true">{t(`short.${code}`)}</span>
            <span className="sr-only">{t(`name.${code}`)}</span>
          </span>
        ) : (
          <Link
            key={code}
            href={href}
            locale={code}
            lang={code}
            hrefLang={code}
            aria-label={t("linkLabel", {
              short: t(`short.${code}`),
              name: t(`name.${code}`),
            })}
            className={cn(
              textLinkClassName(),
              "flex min-h-12 items-center px-2",
            )}
          >
            {t(`short.${code}`)}
          </Link>
        ),
      )}
    </nav>
  );
}
