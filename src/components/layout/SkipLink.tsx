import { useTranslations } from "next-intl";

/**
 * "Zum Inhalt springen": the first element in <body>, visible only while it
 * has the keyboard focus. Then it looks like a primary button (52px, Tannengrün,
 * Weiß text) in the top left corner, above the sticky header. The target is
 * <main id="main">.
 */
export function SkipLink() {
  const t = useTranslations("SkipLink");

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-13 focus:items-center focus:rounded focus:bg-tannengruen focus:px-6.5 focus:text-ui focus:font-bold focus:text-weiss focus:no-underline"
    >
      {t("label")}
    </a>
  );
}
