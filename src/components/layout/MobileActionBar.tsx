"use client";

/*
 * Client component because only the browser side knows the current route:
 * a layout gets no pathname, and usePathname is a client hook.
 */

import { useTranslations } from "next-intl";
import { Button, buttonClassName } from "@/components/ui/Button";
import { useRoutePathname } from "@/i18n/route-pathname";
import { telHref } from "@/lib/phone";
import { showsActionBar } from "./navigation";

type MobileActionBarProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string;
};

/**
 * "Anrufen" and "Anfrage" at the bottom of the screen on phones,
 * BRIEF.md section 3. Not on pages from PAGES_WITHOUT_ACTION_BAR.
 *
 * Goes last in <body>, after the footer. It is sticky, not fixed: the bar
 * keeps its own place at the end of the page and only sticks to the bottom
 * of the screen while scrolling. So it never covers the footer or the
 * content, and no padding has to repeat its height.
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
      className="sticky bottom-0 z-30 border-t border-linie bg-papier p-2 md:hidden"
    >
      <ul className="grid grid-cols-2 gap-2">
        <li className="flex">
          <a
            href={telHref(phone)}
            className={buttonClassName("secondary", "w-full")}
          >
            {t("call")}
          </a>
        </li>
        <li className="flex">
          <Button href="/anfrage" className="w-full">
            {t("request")}
          </Button>
        </li>
      </ul>
    </nav>
  );
}
