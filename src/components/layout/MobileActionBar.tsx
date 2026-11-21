"use client";

/*
 * Client component because only the browser side knows the current route:
 * a layout gets no pathname, and usePathname is a client hook.
 */

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneIcon } from "@/components/ui/icons";
import { useRoutePathname } from "@/i18n/route-pathname";
import { telHref } from "@/lib/phone";
import { showsActionBar } from "./navigation";

type MobileActionBarProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string;
};

/**
 * "Anrufen" and "Anfrage" at the bottom of the screen below md, mockup 04.
 * Not on pages from PAGES_WITHOUT_ACTION_BAR (the ones with a form).
 *
 * Goes last in <body>, after the footer. It is sticky, not fixed: the bar
 * keeps its own place at the end of the page and only sticks to the bottom
 * of the screen while scrolling. So it never covers the footer or the
 * content, and no padding has to repeat its height. Its height, 81px, is
 * --action-bar-height in globals.css, which the scroll margins use.
 */
export function MobileActionBar({ phone }: MobileActionBarProps) {
  const t = useTranslations("MobileActionBar");
  const pathname = useRoutePathname();

  if (!showsActionBar(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label={t("label")}
      data-sticky-bar
      className="sticky bottom-0 z-30 border-t border-linie bg-weiss px-4 pt-3 pb-4 md:hidden"
    >
      <ul className="flex gap-3">
        <li className="flex-1">
          <ButtonLink
            href={telHref(phone)}
            variant="secondary"
            icon={<PhoneIcon />}
            fullWidth
          >
            {t("call")}
          </ButtonLink>
        </li>
        <li className="flex-1">
          <ButtonLink href="/anfrage" fullWidth>
            {t("request")}
          </ButtonLink>
        </li>
      </ul>
    </nav>
  );
}
