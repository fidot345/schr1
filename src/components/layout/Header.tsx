import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import type { Href, SlugTranslations } from "@/i18n/locale-switch-href";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { MAIN_NAVIGATION } from "./navigation";

type HeaderProps = {
  /** The company's name for the logo link's label: "Schreinerei Tannrieder". */
  companyName: string;
  /** The logo word from SiteSettings: "Tannrieder". */
  brandName: string;
  /** Passed on to the language switcher, see LocaleSwitcher. */
  alternateHref?: Href;
  /** Passed on to the language switcher, see LocaleSwitcher. */
  translatedSlugs?: SlugTranslations;
};

const MENU_LINK_CLASS =
  "block py-4 font-display text-h3 text-graphit no-underline hover:text-tannengruen-dunkel hover:underline";

/**
 * The site header, mockup 01a (from 1280px) and 04 (phone and tablet).
 *
 * From xl: the full logo, the menu of five items, DE | EN and the request
 * button in one row, 77px with the line. Below xl: the compact logo and the
 * "Menü" button, 64px; the menu opens over the whole screen (MobileMenu).
 *
 * Sticky, with a Linie line underneath. Sticky works only inside the parent,
 * so the header must be a direct child of <body>; the vacation banner goes
 * before it as a sibling. Its height comes from --header-height in
 * globals.css, which the scroll margins use as well.
 */
export function Header({
  companyName,
  brandName,
  alternateHref,
  translatedSlugs,
}: HeaderProps) {
  const t = useTranslations("Header");
  const tNavigation = useTranslations("Navigation");
  const tLocaleSwitcher = useTranslations("LocaleSwitcher");

  const homeLink = (
    <Link
      href="/"
      aria-label={t("homeLabel", { name: companyName })}
      className="flex shrink-0 items-center text-graphit no-underline"
    >
      <Logo
        variant="full"
        name={brandName}
        descriptor={t("logoDescriptor")}
        className="max-xl:hidden"
      />
      <Logo variant="compact" name={brandName} className="xl:hidden" />
    </Link>
  );

  return (
    <header
      data-sticky-bar
      className="sticky top-0 z-40 flex min-h-(--header-height) items-center border-b border-linie bg-papier"
    >
      <Container className="flex w-full items-center justify-between gap-8 max-md:pr-4">
        {homeLink}

        <nav aria-label={t("menuLabel")} className="ml-auto hidden xl:block">
          <ul className="flex gap-7 text-ui">
            {MAIN_NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2 text-graphit no-underline hover:text-tannengruen-dunkel hover:underline"
                >
                  {tNavigation(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-6 xl:flex">
          <LocaleSwitcher
            alternateHref={alternateHref}
            translatedSlugs={translatedSlugs}
          />
          <ButtonLink href="/anfrage" size="header">
            {t("cta")}
          </ButtonLink>
        </div>

        <MobileMenu home={homeLink}>
          <nav aria-label={t("menuLabel")}>
            <ul className="divide-y divide-linie">
              {MAIN_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={MENU_LINK_CLASS}>
                    {tNavigation(item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LocaleSwitcher
            alternateHref={alternateHref}
            translatedSlugs={translatedSlugs}
            label={tLocaleSwitcher("menuLabel")}
            className="mt-8"
          />
          <ButtonLink href="/anfrage" fullWidth className="mt-6">
            {t("cta")}
          </ButtonLink>
        </MobileMenu>
      </Container>
    </header>
  );
}
