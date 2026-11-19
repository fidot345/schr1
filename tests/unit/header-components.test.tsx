import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import {
  MAIN_NAVIGATION,
  PAGES_WITHOUT_ACTION_BAR,
  type Pathname,
  showsActionBar,
} from "@/components/layout/navigation";
import { buttonClassName } from "@/components/ui/Button";
import { routing } from "@/i18n/routing";
import { classesOf, render, tagWithId } from "./support/render";

const route = vi.hoisted(() => ({ pathname: "/" as string }));

/* Same stand-ins as in layout-components.test.tsx: Link is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
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

vi.mock("next/navigation", () => ({ useParams: () => ({}) }));

/** The opening tag of the first element that matches. */
const openingTag = (html: string, pattern: RegExp): string =>
  html.match(pattern)?.[0] ?? "";

describe("Header", () => {
  route.pathname = "/";
  const html = render(<Header />);

  it("is a sticky <header> after a sentinel, not yet compact", () => {
    expect(html).toMatch(
      /<div aria-hidden="true" class="[^"]*"><\/div><header /,
    );
    const header = openingTag(html, /<header [^>]*>/);
    expect(classesOf(header)).toEqual(
      expect.arrayContaining(["group", "sticky", "top-0", "bg-papier"]),
    );
    expect(header).not.toContain("data-compact");
    // globals.css: focus inside a sticky bar gets no scroll margin.
    expect(header).toContain("data-sticky-bar");
  });

  it("shrinks the bar only through group-data-compact, with motion-safe transition", () => {
    const bar = openingTag(html, /<header [^>]*><div [^>]*>/).replace(
      /^<header [^>]*>/,
      "",
    );
    expect(classesOf(bar)).toEqual(
      expect.arrayContaining([
        "h-20",
        "group-data-compact:h-16",
        "motion-safe:transition-[height]",
        "motion-safe:duration-200",
      ]),
    );
    expect(
      classesOf(bar).filter((name) => name.startsWith("transition")),
    ).toEqual([]);
  });

  it("links the logo to the home page with a name that contains the brand", () => {
    expect(html).toMatch(
      /<a href="\/" aria-label="Tannrieder – zur Startseite"[^>]*>/,
    );
  });

  it("has the main menu twice: in the row from xl and in the mobile menu", () => {
    const navs = html.match(/<nav aria-label="Hauptmenü"/g) ?? [];
    expect(navs).toHaveLength(2);
    for (const item of MAIN_NAVIGATION) {
      const links = html.match(new RegExp(`<a href="${item.href}"`, "g")) ?? [];
      expect(links, item.href).toHaveLength(2);
    }
    expect(html).toMatch(/<nav aria-label="Hauptmenü" class="hidden xl:block"/);
  });

  it("links 'Projekt anfragen' to the request page", () => {
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
  });

  it("has a menu button that controls the closed menu panel", () => {
    const button = openingTag(html, /<button [^>]*>/);
    expect(button).toContain('type="button"');
    expect(button).toContain('aria-expanded="false"');
    const panelId = button.match(/aria-controls="([^"]+)"/)?.[1] ?? "";
    expect(panelId).not.toBe("");

    const panel = tagWithId(html, panelId);
    expect(panel).toMatch(/^<div /);
    expect(panel).toContain("hidden");
    expect(classesOf(panel)).toEqual(
      expect.arrayContaining(["fixed", "inset-x-0", "bottom-0", "xl:hidden"]),
    );
    expect(html).toMatch(/<\/svg>Menü<\/button>/);
  });

  it("hides the menu icon from screen readers", () => {
    expect(html).toMatch(/<svg aria-hidden="true" focusable="false"/);
  });

  it("puts the language switcher and the request button into the menu", () => {
    const panelId =
      openingTag(html, /<button [^>]*>/).match(
        /aria-controls="([^"]+)"/,
      )?.[1] ?? "";
    const panel = html.slice(html.indexOf(tagWithId(html, panelId)));
    expect(panel).toContain('<nav aria-label="Sprache im Menü"');
    expect(panel).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
  });

  it("names the two language switchers differently", () => {
    const names = [...html.matchAll(/<nav aria-label="(Sprache[^"]*)"/g)].map(
      (match) => match[1],
    );
    expect(names).toEqual(["Sprache", "Sprache im Menü"]);
    const english = render(<Header />, "en");
    expect(english).toContain('<nav aria-label="Language in the menu"');
  });

  it("is in English on /en", () => {
    const english = render(<Header />, "en");
    expect(english).toMatch(/aria-label="Tannrieder – home page"/);
    expect(english).toMatch(/<nav aria-label="Main menu"/);
    expect(english).toMatch(/<\/svg>Menu<\/button>/);
    expect(english).toMatch(/>Request a project<\/a>/);
    expect(english).toMatch(/>Services<\/a>/);
  });
});

describe("MobileActionBar", () => {
  const renderOn = (pathname: string, locale: "de" | "en" = "de") => {
    route.pathname = pathname;
    return render(<MobileActionBar phone="089 99998 412" />, locale);
  };

  it("is a sticky nav at the bottom, only on phones", () => {
    const nav = openingTag(renderOn("/"), /^<nav [^>]*>/);
    expect(nav).toContain('aria-label="Schnellkontakt"');
    expect(classesOf(nav)).toEqual(
      expect.arrayContaining(["sticky", "bottom-0", "md:hidden"]),
    );
    expect(classesOf(nav)).not.toContain("fixed");
    expect(nav).toContain("data-sticky-bar");
  });

  it("calls through a tel: link styled as a button", () => {
    const html = renderOn("/");
    expect(html).toContain(
      `<a href="tel:+498999998412" class="${buttonClassName("secondary", "w-full")}">Anrufen</a>`,
    );
  });

  it("links 'Anfrage' to the request page as the primary button", () => {
    const link = openingTag(renderOn("/"), /<a href="\/anfrage"[^>]*>/);
    expect(classesOf(link)).toEqual(
      expect.arrayContaining(["bg-tannengruen", "text-weiss", "w-full"]),
    );
    expect(renderOn("/")).toMatch(/>Anfrage<\/a>/);
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

  it.each([
    "/",
    "/leistungen",
    "/leistungen/[slug]",
    "/referenzen/[slug]",
    "/anfrage/danke",
    "/karriere/danke",
    "/impressum",
  ])("is shown on %s", (pathname) => {
    expect(renderOn(pathname)).toMatch(/^<nav /);
  });
});

describe("showsActionBar", () => {
  it("knows every pathname from routing", () => {
    const pathnames = Object.keys(routing.pathnames) as Pathname[];
    for (const pathname of PAGES_WITHOUT_ACTION_BAR) {
      expect(pathnames).toContain(pathname);
    }
    const shown = pathnames.filter(showsActionBar);
    expect(shown).toHaveLength(
      pathnames.length - PAGES_WITHOUT_ACTION_BAR.length,
    );
  });
});
