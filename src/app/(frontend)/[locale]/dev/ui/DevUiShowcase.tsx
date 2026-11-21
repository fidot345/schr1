import { useTranslations } from "next-intl";

/**
 * Empty overview while the old design is gone: redesign session 1 puts the
 * palette and the type scale here, session 2 the components.
 */
export function DevUiShowcase() {
  const t = useTranslations("DevUi");

  return (
    <main id="main">
      <h1>{t("title")}</h1>
    </main>
  );
}
