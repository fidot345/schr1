import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SiteLayout from "@/app/(frontend)/[locale]/(site)/layout";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import {
  MAIN_NAVIGATION,
  PAGES_WITHOUT_ACTION_BAR,
} from "@/components/layout/navigation";
import { SkipLink } from "@/components/layout/SkipLink";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { classesOf, render, tagWithId } from "./support/render";

/*
 * SiteSettings as the seed writes them (seed/data.ts), the way
 * getSiteSettings returns them, in both languages.
 */
const SITE = vi.hoisted(() => {
  const company = {
    name: "Schreinerei Tannrieder",
    logoWord: "Tannrieder",
    owner: "Johannes Tannrieder",
    street: "Werkstattweg 4",
    postalCode: "85999",
    city: "Wendelfing",
    phone: "089 99998 412",
    email: "info@tannrieder.example",
  };
  return {
    de: {
      company,
      tagline: "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
      openingHours: [
        { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
        { id: "b", days: "Fr", hours: "7:00–12:00" },
      ],
      vacation: null,
    },
    en: {
      company,
      tagline: "Joinery with its own workshop in Wendelfing, since 1989.",
      openingHours: [
        { id: "a", days: "Mon–Thu", hours: "7:00–16:30" },
        { id: "b", days: "Fri", hours: "7:00–12:00" },
      ],
      vacation: null,
    },
  };
});

const route = vi.hoisted(() => ({
  pathname: "/" as string,
  params: {} as Record<string, string>,
}));

/*
 * Link is a plain <a>; the locale it was given shows up as data-locale.
 * getPathname builds the paths as next-intl does (support/navigation.ts).
 */
vi.mock("@/i18n/navigation", async () => ({
  getPathname: (await import("./support/navigation")).getPathname,
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: {
    href: string | { pathname: string };
    locale?: string;
    children: ReactNode;
  }) => (
    <a
      href={typeof href === "string" ? href : href.pathname}
      data-locale={locale}
      {...rest}
    >
      {children}
    </a>
  ),
  usePathname: () => route.pathname,
}));

vi.mock("next/navigation", () => ({
  useParams: () => route.params,
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

vi.mock("next-intl/server", () => ({ setRequestLocale: () => {} }));

/*
 * The layout reads SiteSettings and the translated slugs from Payload; here
 * the settings are the fixture above and there are no slugs.
 */
vi.mock("@/lib/content", () => ({
  getSiteSettings: async (locale: "de" | "en") => SITE[locale],
  getSlugTranslations: async () => ({}),
}));

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

/** The opening tag of the first element that matches. */
const openingTag = (html: string, pattern: RegExp): string =>
  html.match(pattern)?.[0] ?? "";

const site = SITE.de;

describe("Header", () => {
  route.pathname = "/";
  const html = render(
    <Header
      companyName={site.company.name}
      brandName={site.company.logoWord}
    />,
  );

  it("is a sticky <header> with a Linie line, as high as --header-height", () => {
    const header = openingTag(html, /<header [^>]*>/);
    expect(classesOf(header)).toEqual(
      expect.arrayContaining([
        "sticky",
        "top-0",
        "border-b",
        "border-linie",
        "bg-papier",
        "min-h-(--header-height)",
      ]),
    );
    // globals.css: focus inside a sticky bar gets no scroll margin.
    expect(header).toContain("data-sticky-bar");
  });

  it("links the logo to the home page with a name that contains the visible text", () => {
    expect(html).toMatch(
      /<a href="\/" aria-label="Schreinerei Tannrieder, zur Startseite"/,
    );
    // The full logo (from xl) and the compact one (below xl), one of them hidden.
    expect(html).toMatch(/text-xs[^>]*>Schreinerei<\/span> <span/);
    expect(html).toContain("max-xl:hidden");
    expect(html).toMatch(/xl:hidden[^>]*><svg[^>]*width="24"/);
  });

  it("has the main menu of five items in a row from xl", () => {
    const nav = openingTag(html, /<nav aria-label="Hauptmenü"[^>]*>/);
    expect(classesOf(nav)).toEqual(
      expect.arrayContaining(["ml-auto", "hidden", "xl:block"]),
    );
    const row = html.slice(html.indexOf(nav), html.indexOf("</nav>"));
    expect(
      [...row.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [
        m[1],
        m[2],
      ]),
    ).toEqual([
      ["/leistungen", "Leistungen"],
      ["/referenzen", "Referenzen"],
      ["/ueber-uns", "Über uns"],
      ["/karriere", "Karriere"],
      ["/kontakt", "Kontakt"],
    ]);
    expect(MAIN_NAVIGATION).toHaveLength(5);
  });

  it("has DE | EN and the 48px request button in a group shown from xl", () => {
    expect(html).toMatch(/class="hidden items-center gap-6 xl:flex"/);
    const button = openingTag(
      html,
      /<a href="\/anfrage" class="[^"]*min-h-12[^"]*">/,
    );
    expect(button).not.toBe("");
    expect(classesOf(button)).toContain("bg-tannengruen");
    expect(html).toMatch(/>Projekt anfragen<\/a>/);
  });

  it("has a Feldrand 'Menü' button below xl that controls the closed dialog", () => {
    const button = openingTag(html, /<button [^>]*>/);
    expect(button).toContain('type="button"');
    expect(button).toContain('aria-expanded="false"');
    expect(classesOf(button)).toEqual(
      expect.arrayContaining(["min-h-11", "border-feldrand", "xl:hidden"]),
    );
    expect(html).toMatch(/<\/svg>Menü<\/button>/);

    const dialogId = button.match(/aria-controls="([^"]+)"/)?.[1] ?? "";
    const dialog = tagWithId(html, dialogId);
    expect(dialog).toMatch(/^<dialog /);
    expect(dialog).not.toMatch(/\sopen[\s=>]/);
    expect(dialog).toContain('aria-label="Menü"');
    expect(dialog).toContain("data-lenis-prevent");
    expect(classesOf(dialog)).toEqual(
      expect.arrayContaining(["bg-papier", "size-full", "xl:hidden"]),
    );
    // A display class would override the display:none of a closed dialog.
    expect(
      classesOf(dialog).filter((name) =>
        /^(block|flex|grid|inline|inline-block|inline-flex)$/.test(name),
      ),
    ).toEqual([]);
  });

  it("fills the dialog with the top row, the menu in h3, DE | EN and the request button", () => {
    const dialog = html.slice(html.indexOf("<dialog"));
    expect(dialog).toMatch(/<\/svg>Schließen<\/button>/);
    expect(dialog).toContain("divide-y divide-linie");
    for (const item of MAIN_NAVIGATION) {
      expect(dialog).toMatch(
        new RegExp(`<a href="${item.href}" class="[^"]*text-h3`),
      );
    }
    expect(dialog).toContain('<nav aria-label="Sprache im Menü"');
    expect(dialog).toMatch(
      /<a href="\/anfrage" class="[^"]*w-full[^"]*">Projekt anfragen<\/a>/,
    );
  });

  it("is in English on /en", () => {
    const english = render(
      <Header companyName="Schreinerei Tannrieder" brandName="Tannrieder" />,
      "en",
    );
    expect(english).toContain('aria-label="Schreinerei Tannrieder, home page"');
    expect(english).toContain('<nav aria-label="Main menu"');
    expect(english).toMatch(/<\/svg>Menu<\/button>/);
    expect(english).toMatch(/<\/svg>Close<\/button>/);
    expect(english).toMatch(/>Request a project<\/a>/);
    expect(english).toMatch(/>Services<\/a>/);
  });
});

describe("LocaleSwitcher", () => {
  const renderOn = (locale: "de" | "en") => {
    route.pathname = "/";
    return render(<LocaleSwitcher />, locale);
  };

  it("shows the current language as text and the other one as a link", () => {
    const html = renderOn("de");
    expect(html).toMatch(/<span lang="de" aria-current="true"[^>]*>/);
    expect(html).toMatch(
      /<a lang="en" hrefLang="en" aria-label="EN – English"[^>]*href="\/en"[^>]*>EN<\/a>/,
    );
    expect(html).toMatch(
      /<span aria-hidden="true" class="text-linie">\|<\/span>/,
    );
    expect(html).toContain('<nav aria-label="Sprache"');
  });

  it("is turned around on /en", () => {
    const html = renderOn("en");
    expect(html).toMatch(/<span lang="en" aria-current="true"/);
    expect(html).toMatch(/<a lang="de"[^>]*aria-label="DE – Deutsch"/);
    expect(html).toContain('<nav aria-label="Language"');
  });

  it("links German without the /de prefix, which would redirect", () => {
    route.pathname = "/leistungen";
    const html = render(<LocaleSwitcher />, "en");
    expect(html).toMatch(/<a lang="de"[^>]*href="\/leistungen"/);
  });
});

describe("MobileActionBar", () => {
  const renderOn = (
    pathname: string,
    locale: "de" | "en" = "de",
    params: Record<string, string> = {},
  ) => {
    route.pathname = pathname;
    route.params = params;
    return render(<MobileActionBar phone="089 99998 412" />, locale);
  };

  it("is a sticky bar at the bottom, only below md, Weiß with a Linie line", () => {
    const nav = openingTag(renderOn("/"), /^<nav [^>]*>/);
    expect(nav).toContain('aria-label="Schnellkontakt"');
    expect(classesOf(nav)).toEqual(
      expect.arrayContaining([
        "sticky",
        "bottom-0",
        "md:hidden",
        "bg-weiss",
        "border-t",
        "border-linie",
        "pt-3",
        "pb-4",
        "px-4",
      ]),
    );
    expect(classesOf(nav)).not.toContain("fixed");
    expect(nav).toContain("data-sticky-bar");
  });

  it("calls through a tel: link with a phone icon, the secondary button", () => {
    const html = renderOn("/");
    const link = openingTag(html, /<a href="tel:\+498999998412"[^>]*>/);
    expect(classesOf(link)).toEqual(
      expect.arrayContaining(["border-2", "border-tannengruen", "w-full"]),
    );
    expect(html).toMatch(
      /<svg[^>]*aria-hidden="true"[^>]*>.*<\/svg>Anrufen<\/a>/,
    );
  });

  it("links 'Anfrage' to the request page as the primary button", () => {
    const html = renderOn("/");
    const link = openingTag(html, /<a href="\/anfrage"[^>]*>/);
    expect(classesOf(link)).toEqual(
      expect.arrayContaining(["bg-tannengruen", "text-weiss", "w-full"]),
    );
    expect(html).toMatch(/>Anfrage<\/a>/);
  });

  it("is in English on /en", () => {
    const html = renderOn("/", "en");
    expect(html).toMatch(/^<nav aria-label="Quick contact"/);
    expect(html).toMatch(/>Call<\/a>/);
    expect(html).toMatch(/>Request<\/a>/);
  });

  it.each(PAGES_WITHOUT_ACTION_BAR)("is not shown on %s", (pathname) => {
    expect(renderOn(pathname)).toBe("");
  });

  it("is not shown on an English job page while it is prerendered", () => {
    // next-intl's usePathname gives the raw internal address there.
    expect(renderOn("/karriere/joiner", "en", { slug: "joiner" })).toBe("");
  });

  it.each(["/", "/leistungen", "/referenzen/[slug]", "/impressum"])(
    "is shown on %s",
    (pathname) => {
      expect(renderOn(pathname)).toMatch(/^<nav /);
    },
  );
});

describe("VacationBanner", () => {
  const FROM = "2026-08-11T12:00:00.000Z";
  const TO = "2026-08-22T12:00:00.000Z";

  it("is a Moos strip with Graphit text in 15px, named for screen readers", () => {
    const html = render(<VacationBanner enabled from={FROM} to={TO} />);
    expect(html).toMatch(/^<section aria-label="Betriebsurlaub"/);
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["bg-moos", "text-graphit", "text-xs"]),
    );
  });

  it("writes the dates in the language of the page", () => {
    expect(render(<VacationBanner enabled from={FROM} to={TO} />)).toContain(
      "Betriebsurlaub vom 11. August 2026 bis 22. August 2026",
    );
    expect(
      render(<VacationBanner enabled from={FROM} to={TO} />, "en"),
    ).toContain(
      "Closed for company holidays from August 11, 2026 to August 22, 2026",
    );
  });

  it("takes its own text instead of the standard one", () => {
    const html = render(
      <VacationBanner enabled from={FROM} to={TO} text="Wir sind im Urlaub" />,
    );
    expect(html).toContain("Wir sind im Urlaub");
    expect(html).not.toContain("Betriebsurlaub vom");
  });

  it.each([
    ["switched off", { enabled: false, from: FROM, to: TO }],
    ["without dates", { enabled: true }],
    ["with an invalid date", { enabled: true, from: "soon", to: TO }],
    ["ending before it starts", { enabled: true, from: TO, to: FROM }],
  ])("shows nothing %s", (_name, props) => {
    expect(render(<VacationBanner {...props} />)).toBe("");
  });
});

describe("Footer", () => {
  const html = render(
    <Footer
      company={site.company}
      openingHours={site.openingHours}
      tagline={site.tagline}
    />,
  );

  it("is Graphit with Moos text, 16px, and a Weiß focus ring", () => {
    const footer = openingTag(html, /^<footer [^>]*>/);
    expect(classesOf(footer)).toEqual(
      expect.arrayContaining([
        "bg-graphit",
        "text-moos",
        "text-small",
        "focus-ring-light",
        "pt-16",
        "pb-8",
      ]),
    );
  });

  it("leaves the tagline out when SiteSettings has none", () => {
    const bare = render(
      <Footer
        company={site.company}
        openingHours={site.openingHours}
        tagline={null}
      />,
    );
    expect(bare).not.toContain("max-w-[22em]");
    expect(bare).toContain(">Tannrieder</span>");
  });

  it("has the light logo and the tagline", () => {
    expect(html).toMatch(/<svg[^>]*width="26"[^>]*height="30"/);
    expect(html).toContain(">Tannrieder</span>");
    expect(html).toContain(
      "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
    );
  });

  it("has the contact column with the phone, the e-mail and the address", () => {
    expect(html).toMatch(/<h2 class="[^"]*font-bold[^"]*">Kontakt<\/h2>/);
    expect(html).toMatch(
      /<a href="tel:\+498999998412"[^>]*>089 99998 412<\/a>/,
    );
    expect(html).toMatch(
      /<a href="mailto:info@tannrieder\.example"[^>]*>info@tannrieder\.example<\/a>/,
    );
    expect(html).toContain("Werkstattweg 4");
    expect(html).toContain("85999 Wendelfing");
  });

  it("has the opening hours with 'Uhr' in German and without it in English", () => {
    expect(html).toContain("Mo–Do 7:00–16:30 Uhr");
    expect(html).toContain("Fr 7:00–12:00 Uhr");

    const english = SITE.en;
    const htmlEn = render(
      <Footer
        company={english.company}
        openingHours={english.openingHours}
        tagline={english.tagline}
      />,
      "en",
    );
    expect(htmlEn).toContain("Mon–Thu 7:00–16:30<");
    expect(htmlEn).toContain("Fri 7:00–12:00<");
    expect(htmlEn).not.toContain("Uhr");
  });

  it("has the pages as a named navigation with the five menu items", () => {
    expect(html).toMatch(/<nav aria-labelledby="footer-pages"/);
    expect(html).toMatch(/<h2 id="footer-pages"[^>]*>Seiten<\/h2>/);
    const nav = html.slice(html.indexOf('<nav aria-labelledby="footer-pages"'));
    for (const item of MAIN_NAVIGATION) {
      expect(nav).toContain(`<a href="${item.href}"`);
    }
  });

  it("ends with the concept note and the legal pages under a Schiefer line", () => {
    expect(html).toContain("border-t border-schiefer");
    expect(html).toContain(
      "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.",
    );
    expect(html).toMatch(/<nav aria-label="Rechtliches"/);
    expect(html).toMatch(/<a href="\/impressum"[^>]*>Impressum<\/a>/);
    expect(html).toMatch(/<a href="\/datenschutz"[^>]*>Datenschutz<\/a>/);
  });

  it("makes every link Moos with a Weiß hover, as high as its line", () => {
    const links = [...html.matchAll(/<a [^>]*>/g)].map((match) => match[0]);
    expect(links.length).toBeGreaterThanOrEqual(9);
    for (const link of links) {
      expect(classesOf(link)).toEqual(
        expect.arrayContaining([
          "text-moos",
          "hover:text-weiss",
          "inline-block",
        ]),
      );
    }
  });
});

describe("SkipLink", () => {
  it("jumps to <main> and shows only on focus", () => {
    const html = render(<SkipLink />);
    expect(html).toMatch(/^<a href="#main"/);
    expect(html).toContain(">Zum Inhalt springen</a>");
    expect(classesOf(html)).toEqual(
      expect.arrayContaining([
        "sr-only",
        "focus:not-sr-only",
        "focus:fixed",
        "focus:bg-tannengruen",
      ]),
    );
  });
});

describe("SiteLayout", () => {
  const renderLayout = async (locale: "de" | "en") =>
    render(
      await SiteLayout({
        children: <p>Seite</p>,
        params: Promise.resolve({ locale }),
      }),
      locale,
    );

  it("puts header, main, footer and the mobile bar after each other, with no holiday notice", async () => {
    route.pathname = "/";
    const html = await renderLayout("de");
    const order = [
      html.indexOf("<header"),
      html.indexOf('<main id="main"'),
      html.indexOf("<footer"),
      html.indexOf('<nav aria-label="Schnellkontakt"'),
    ];
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).not.toContain('aria-label="Betriebsurlaub"');
    expect(html).toMatch(
      /<main id="main" class="flex-1"><p>Seite<\/p><\/main>/,
    );
  });

  it("is in English on /en", async () => {
    route.pathname = "/";
    const html = await renderLayout("en");
    expect(html).toContain('<nav aria-label="Quick contact"');
    expect(html).toContain("Joinery with its own workshop in Wendelfing");
  });

  it("is a 404 for an unknown language", async () => {
    await expect(
      SiteLayout({
        children: null,
        params: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("404");
  });
});

describe("scroll margins under the sticky bars (WCAG 2.4.11)", () => {
  it("knows the height of the header and of the mobile bar", () => {
    expect(css).toMatch(/--header-height: 4rem;/);
    expect(css).toMatch(/--action-bar-height: 5\.0625rem;/);
    expect(css).toMatch(/@variant xl \{\s*--header-height: 4\.8125rem;/);
  });

  it("keeps focus and anchors below the header, and focus above the mobile bar", () => {
    expect(css).toMatch(
      /:focus,\s*:target \{\s*scroll-margin-top: calc\(var\(--header-height\) \+ var\(--spacing\) \* 4\);/,
    );
    expect(css).toMatch(
      /:focus \{\s*@variant max-md \{\s*scroll-margin-bottom: calc\(var\(--action-bar-height\) \+ var\(--spacing\) \* 4\);/,
    );
  });

  it("leaves the bars' own elements alone", () => {
    expect(css).toMatch(/\[data-sticky-bar\] :focus \{\s*scroll-margin: 0;/);
  });
});
