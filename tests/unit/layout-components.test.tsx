import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { type CompanyContact, Footer } from "@/components/layout/Footer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { localeSwitchHref } from "@/i18n/locale-switch-href";
import { telHref } from "@/lib/phone";
import { classesOf, render } from "./support/render";

const route = vi.hoisted(() => ({
  pathname: "/",
  params: {} as Record<string, string>,
}));

/*
 * next-intl's Link and usePathname need a Next.js request. Here Link is a
 * plain <a>: object hrefs are filled with their params, and the target
 * locale is kept in data-locale.
 */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
    locale?: string;
    children: ReactNode;
  }) => {
    const path =
      typeof href === "string"
        ? href
        : Object.entries(href.params ?? {}).reduce(
            (result, [key, value]) => result.replace(`[${key}]`, value),
            href.pathname,
          );
    return (
      <a href={path} data-locale={locale} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => route.pathname,
}));

vi.mock("next/navigation", () => ({ useParams: () => route.params }));

const company: CompanyContact = {
  name: "Schreinerei Tannrieder",
  street: "Werkstattweg 4",
  postalCode: "85999",
  city: "Wendelfing",
  phone: "089 99998 412",
  email: "info@tannrieder.example",
};

const openingHours = [
  { days: "Mo–Do", hours: "7:00–16:30" },
  { days: "Fr", hours: "7:00–12:00" },
];

describe("VacationBanner", () => {
  it("renders nothing without both dates", () => {
    expect(render(<VacationBanner />)).toBe("");
    expect(render(<VacationBanner from="2026-12-23" />)).toBe("");
    expect(render(<VacationBanner to="2027-01-06" />)).toBe("");
    expect(render(<VacationBanner from={null} to={null} />)).toBe("");
  });

  it("renders nothing for invalid or reversed dates", () => {
    expect(render(<VacationBanner from="kaputt" to="2027-01-06" />)).toBe("");
    expect(render(<VacationBanner from="2027-01-06" to="2026-12-23" />)).toBe(
      "",
    );
  });

  it("formats the dates in the page's language", () => {
    const props = { from: "2026-12-23", to: "2027-01-06" };
    expect(render(<VacationBanner {...props} />)).toContain(
      "Betriebsurlaub vom 23. Dezember 2026 bis 6. Januar 2027",
    );
    expect(render(<VacationBanner {...props} />, "en")).toContain(
      "from December 23, 2026 to January 6, 2027",
    );
  });

  it("uses the workshop's time zone for timestamps from Payload", () => {
    // 23:30 UTC on 22 December is already 23 December in Bavaria.
    expect(
      render(
        <VacationBanner
          from="2026-12-22T23:30:00.000Z"
          to="2027-01-06T11:00:00.000Z"
        />,
      ),
    ).toContain("vom 23. Dezember 2026");
  });

  it("is Graphit on Moos", () => {
    const html = render(<VacationBanner from="2026-12-23" to="2027-01-06" />);
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["bg-moos", "text-graphit"]),
    );
  });
});

describe("Footer", () => {
  const html = render(<Footer company={company} openingHours={openingHours} />);

  it("is a <footer> on Graphit with light text and a light focus ring", () => {
    expect(html).toMatch(/^<footer /);
    expect(classesOf(html.match(/^<footer [^>]*>/)?.[0] ?? "")).toEqual(
      expect.arrayContaining(["bg-graphit", "text-papier", "focus-ring-light"]),
    );
  });

  it("shows the contact data from props with tel: and mailto: links", () => {
    expect(html).toContain("Werkstattweg 4");
    expect(html).toContain("85999 Wendelfing");
    expect(html).toMatch(
      /<a href="tel:\+498999998412"[^>]*>089 99998 412<\/a>/,
    );
    expect(html).toMatch(
      /<a href="mailto:info@tannrieder.example"[^>]*>info@tannrieder.example<\/a>/,
    );
  });

  it("lists the opening hours from props", () => {
    expect(html).toMatch(/<dt[^>]*>Mo–Do<\/dt><dd>7:00–16:30<\/dd>/);
    expect(html).toMatch(/<dt[^>]*>Fr<\/dt><dd>7:00–12:00<\/dd>/);
  });

  it("links the menu and the legal pages through next-intl", () => {
    for (const path of [
      "/leistungen",
      "/referenzen",
      "/ueber-uns",
      "/karriere",
      "/kontakt",
      "/impressum",
      "/datenschutz",
    ]) {
      expect(html).toMatch(new RegExp(`<a href="${path}"`));
    }
    expect(html).toMatch(/>Impressum<\/a>/);
    expect(html).toMatch(/>Datenschutz<\/a>/);
  });

  it("carries the concept project notice", () => {
    expect(html).toContain(
      "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.",
    );
  });

  it("is in English on /en", () => {
    const english = render(
      <Footer company={company} openingHours={openingHours} />,
      "en",
    );
    expect(english).toMatch(/>Imprint<\/a>/);
    expect(english).toMatch(/>Privacy policy<\/a>/);
    expect(english).toContain("Opening hours");
    expect(english).toContain("Concept project");
  });

  it("uses only light links", () => {
    const links = [...html.matchAll(/<a [^>]*>/g)].map((match) => match[0]);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(classesOf(link)).toContain("text-papier");
      expect(classesOf(link)).not.toContain("text-tannengruen");
    }
  });
});

describe("LocaleSwitcher", () => {
  it("links to the same page in the other language", () => {
    route.pathname = "/leistungen";
    route.params = { locale: "de" };
    const html = render(<LocaleSwitcher />);
    const link = html.match(/<a [^>]*>EN<\/a>/)?.[0] ?? "";
    expect(link).toMatch(/href="\/leistungen"/);
    expect(link).toMatch(/data-locale="en"/);
    expect(link).toMatch(/lang="en"/);
    expect(link).toMatch(/hrefLang="en"|hreflang="en"/);
    expect(link).toMatch(/aria-label="EN – English"/);
  });

  it("shows the current language as text, not as a link", () => {
    route.pathname = "/";
    route.params = { locale: "de" };
    const html = render(<LocaleSwitcher />);
    expect(html).toMatch(/^<nav aria-label="Sprache"/);
    expect(html).toMatch(/<span lang="de" aria-current="true"/);
    expect(html).not.toMatch(/<a [^>]*>DE<\/a>/);
    expect(html).toContain('<span class="sr-only">Deutsch</span>');
  });

  it("links back to German from /en", () => {
    route.pathname = "/kontakt";
    route.params = { locale: "en" };
    const html = render(<LocaleSwitcher />, "en");
    const link = html.match(/<a [^>]*>DE<\/a>/)?.[0] ?? "";
    expect(link).toMatch(/href="\/kontakt"/);
    expect(link).toMatch(/data-locale="de"/);
    expect(link).toMatch(/lang="de"/);
    expect(link).toMatch(/aria-label="DE – Deutsch"/);
    expect(html).toMatch(/^<nav aria-label="Language"/);
  });

  it("keeps the slug when no other href is given", () => {
    route.pathname = "/referenzen/[slug]";
    route.params = { locale: "de", slug: "garderobe-mit-sitzbank" };
    expect(render(<LocaleSwitcher />)).toMatch(
      /<a href="\/referenzen\/garderobe-mit-sitzbank"/,
    );
  });

  it("uses the other language's href from props for translated slugs", () => {
    route.pathname = "/leistungen/[slug]";
    route.params = { locale: "de", slug: "kuechen" };
    const html = render(
      <LocaleSwitcher
        alternateHref={{
          pathname: "/leistungen/[slug]",
          params: { slug: "kitchens" },
        }}
      />,
    );
    expect(html).toMatch(
      /<a href="\/leistungen\/kitchens"[^>]*data-locale="en"/,
    );
  });
});

describe("localeSwitchHref", () => {
  it("returns static routes as they are", () => {
    expect(localeSwitchHref("/kontakt", { locale: "de" })).toBe("/kontakt");
    expect(localeSwitchHref("/", {})).toBe("/");
  });

  it("fills the slug of dynamic routes", () => {
    expect(
      localeSwitchHref("/karriere/[slug]", { locale: "de", slug: "schreiner" }),
    ).toEqual({ pathname: "/karriere/[slug]", params: { slug: "schreiner" } });
  });

  it("falls back to the home page without a slug", () => {
    expect(localeSwitchHref("/karriere/[slug]", {})).toBe("/");
  });
});

describe("telHref", () => {
  it.each([
    ["089 99998 412", "tel:+498999998412"],
    ["+49 89 99998 412", "tel:+498999998412"],
    ["+49 (0)89 99998-412", "tel:+498999998412"],
    ["0049 89 99998412", "tel:+498999998412"],
  ])("turns %s into %s", (phone, href) => {
    expect(telHref(phone)).toBe(href);
  });
});
