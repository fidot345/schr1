import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import type { Href } from "@/i18n/locale-switch-href";
import { Link } from "@/i18n/navigation";
import { HeaderShell } from "./HeaderShell";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { MAIN_NAVIGATION } from "./navigation";

type HeaderProps = {
  /** The logo word from SiteSettings, see brandWord() in src/lib/text.ts. */
  brandName: string;
  /** Passed on to the language switcher, see LocaleSwitcher. */
  alternateHref?: Href;
};

const DESKTOP_LINK_CLASS =
  "flex min-h-12 items-center px-2 font-bold text-graphit underline-offset-4 hover:text-tannengruen hover:underline motion-safe:transition-colors";

const MENU_LINK_CLASS =
  "flex min-h-12 items-center py-2 font-heading text-h3 font-semibold text-graphit underline-offset-4 hover:text-tannengruen hover:underline motion-safe:transition-colors";

/**
 * Site header, BRIEF.md section 3: logo, menu, DE/EN, "Projekt anfragen".
 *
 * From xl (1280px) everything sits in one row. Below that the menu and the
 * language switcher move into the full-screen MobileMenu; the request button
 * stays in the header from md, on phones the MobileActionBar has it.
 *
 * Sticky; once the page scrolls, the bar shrinks from 80px to 64px in 200ms,
 * at once with prefers-reduced-motion. Put VacationBanner right before it.
 */
export function Header({ brandName, alternateHref }: HeaderProps) {
  const t = useTranslations("Header");
  const tNavigation = useTranslations("Navigation");
  const tLocaleSwitcher = useTranslations("LocaleSwitcher");

  return (
    <HeaderShell>
      <Container className="flex h-20 items-center justify-between gap-6 group-data-compact:h-16 motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out">
        <Link
          href="/"
          aria-label={t("homeLabel", { name: brandName })}
          className="flex min-h-12 shrink-0 items-center"
        >
          <Logo name={brandName} />
        </Link>

        <nav aria-label={t("menuLabel")} className="hidden xl:block">
          <ul className="flex items-center gap-2">
            {MAIN_NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={DESKTOP_LINK_CLASS}>
                  {tNavigation(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden xl:block">
            <LocaleSwitcher alternateHref={alternateHref} />
          </div>
          <div className="hidden md:block">
            <Button href="/anfrage">{t("cta")}</Button>
          </div>
          <div className="xl:hidden">
            <MobileMenu>
              <Container className="flex flex-col gap-8 py-8">
                <nav aria-label={t("menuLabel")}>
                  <ul className="flex flex-col gap-2">
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
                  label={tLocaleSwitcher("menuLabel")}
                />
                <div>
                  <Button href="/anfrage">{t("cta")}</Button>
                </div>
              </Container>
            </MobileMenu>
          </div>
        </div>
      </Container>
    </HeaderShell>
  );
}
