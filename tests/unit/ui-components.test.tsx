import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminLogo } from "@/components/admin/AdminGraphics";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { TextLink } from "@/components/ui/TextLink";

/*
 * next-intl's Link needs a Next.js request. In these tests it is a plain <a>
 * marked with data-intl-link, so we can see which element was chosen.
 */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    className,
    children,
  }: {
    href: string | { pathname: string };
    className?: string;
    children: ReactNode;
  }) => (
    <a
      href={typeof href === "string" ? href : href.pathname}
      className={className}
      data-intl-link=""
    >
      {children}
    </a>
  ),
}));

const render = (node: ReactNode): string => renderToStaticMarkup(node);

const classesOf = (html: string): string[] =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");
// Token names from @theme; "h1--line-height" style sub-keys are skipped.
const tokens = (prefix: string): Set<string> =>
  new Set(
    [...css.matchAll(new RegExp(`--${prefix}-([a-z0-9-]+):`, "g"))]
      .map((match) => match[1])
      .filter((name) => !name.includes("--")),
  );
const colorTokens = tokens("color");
const textTokens = tokens("text");
const spacingTokens = tokens("spacing");

const LEVELS = [1, 2, 3, 4] as const;
const VARIANTS = ["primary", "secondary", "text"] as const;

describe("Heading", () => {
  it("renders the tag from level and the size from size", () => {
    const html = render(
      <Heading level={2} size={1}>
        Werkstatt
      </Heading>,
    );
    expect(html).toMatch(/^<h2 /);
    expect(classesOf(html)).toContain("text-h1");
    expect(classesOf(html)).not.toContain("text-h2");
  });

  it("sizes by level when no size is given", () => {
    for (const level of LEVELS) {
      const html = render(<Heading level={level}>Titel</Heading>);
      expect(html).toMatch(new RegExp(`^<h${level} `));
      expect(classesOf(html)).toContain(`text-h${level}`);
      expect(classesOf(html)).toContain("font-heading");
    }
  });
});

describe("Container", () => {
  it("uses the page width and gutter tokens", () => {
    expect(classesOf(render(<Container>Inhalt</Container>))).toEqual(
      expect.arrayContaining([
        "max-w-page",
        "px-gutter-mobile",
        "md:px-gutter-desktop",
      ]),
    );
  });
});

describe("Button", () => {
  it('is a <button type="button"> by default', () => {
    expect(render(<Button>Senden</Button>)).toMatch(
      /^<button [^>]*type="button"/,
    );
  });

  it("passes button attributes through", () => {
    const html = render(
      <Button type="submit" disabled>
        Senden
      </Button>,
    );
    expect(html).toMatch(/type="submit"/);
    expect(html).toMatch(/disabled=""/);
  });

  it("renders the next-intl Link when it has an href", () => {
    const html = render(<Button href="/anfrage">Anfrage</Button>);
    expect(html).toMatch(/^<a [^>]*href="\/anfrage"/);
    expect(html).toContain("data-intl-link");
  });

  it("is at least 48px high with a 4px radius in every variant", () => {
    for (const variant of VARIANTS) {
      const classes = classesOf(render(<Button variant={variant}>Los</Button>));
      expect(classes).toContain("min-h-12");
      expect(classes).toContain("rounded");
    }
  });

  it("fills primary and outlines secondary with Tannengrün", () => {
    const primary = classesOf(render(<Button variant="primary">A</Button>));
    const secondary = classesOf(render(<Button variant="secondary">B</Button>));
    expect(primary).toEqual(
      expect.arrayContaining(["bg-tannengruen", "text-weiss"]),
    );
    expect(secondary).toEqual(
      expect.arrayContaining(["border-tannengruen", "text-tannengruen"]),
    );
    expect(secondary.filter((name) => name.startsWith("bg-"))).toEqual([]);
  });
});

describe("TextLink", () => {
  it("renders the next-intl Link for internal routes", () => {
    expect(render(<TextLink href="/kontakt">Kontakt</TextLink>)).toContain(
      "data-intl-link",
    );
  });

  it("renders a plain <a> for external links", () => {
    const web = render(<TextLink href="https://example.org">Web</TextLink>);
    expect(web).not.toContain("data-intl-link");
    expect(web).toMatch(/rel="noreferrer"/);

    const phone = render(<TextLink href="tel:+498999998412">Tel</TextLink>);
    expect(phone).toMatch(/^<a href="tel:\+498999998412"/);
    expect(phone).not.toContain("rel=");
  });
});

describe("design tokens in ui components", () => {
  const html = [
    render(<Container>x</Container>),
    ...LEVELS.map((level) => render(<Heading level={level}>x</Heading>)),
    ...VARIANTS.map((variant) => render(<Button variant={variant}>x</Button>)),
    render(<TextLink href="/">x</TextLink>),
  ].join("");
  // Drop variants such as hover: or md: and keep the utility itself.
  const utilities = [
    ...new Set(classesOf(html).map((name) => name.split(":").at(-1) ?? "")),
  ];

  it("has no arbitrary values or raw colors", () => {
    expect(utilities.filter((name) => /[[\]#]/.test(name))).toEqual([]);
  });

  it("takes colors and text sizes only from tokens", () => {
    const wrong = utilities.filter((name) => {
      const match = name.match(/^(bg|text|border|decoration|outline)-(.+)$/);
      if (!match) return false;
      const [, kind, value] = match;
      if (/^\d+$/.test(value)) return false; // widths: border-2, decoration-2
      if (kind === "text" && (textTokens.has(value) || value === "center")) {
        return false;
      }
      return !colorTokens.has(value);
    });
    expect(wrong).toEqual([]);
  });

  it("keeps spacing on the 8px grid", () => {
    const wrong = utilities.filter((name) => {
      const match = name.match(/^(?:p|px|py|m|mx|my|gap|min-h)-(.+)$/);
      if (!match) return false;
      const value = match[1];
      if (value === "auto" || spacingTokens.has(value)) return false;
      return !(/^\d+$/.test(value) && Number(value) % 2 === 0);
    });
    expect(wrong).toEqual([]);
  });

  it("has no shadows and only the one radius", () => {
    expect(utilities.filter((name) => /shadow/.test(name))).toEqual([]);
    expect(utilities.filter((name) => name.startsWith("rounded-"))).toEqual([]);
  });
});

describe("AdminLogo", () => {
  it("loads eagerly, it is the LCP of the login page", () => {
    expect(render(<AdminLogo />)).toMatch(/loading="eager"/);
  });
});
