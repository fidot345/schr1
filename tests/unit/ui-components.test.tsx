import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminLogo } from "@/components/admin/AdminGraphics";
import { Footer } from "@/components/layout/Footer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Heading } from "@/components/ui/Heading";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { TextLink } from "@/components/ui/TextLink";
import { classesOf, render } from "./support/render";

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
  usePathname: () => "/",
}));

vi.mock("next/navigation", () => ({ useParams: () => ({}) }));

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

  it("has a flat Moos disabled state in the box variants", () => {
    for (const variant of ["primary", "secondary"] as const) {
      const classes = classesOf(render(<Button variant={variant}>A</Button>));
      expect(classes).toEqual(
        expect.arrayContaining([
          "disabled:bg-moos",
          "disabled:border-linie",
          "disabled:text-schiefer",
          "disabled:cursor-not-allowed",
        ]),
      );
    }
    const text = classesOf(render(<Button variant="text">C</Button>));
    expect(text).toContain("disabled:text-schiefer");
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

  it("is Tannengrün by default and light with a light focus ring", () => {
    const dark = classesOf(render(<TextLink href="/kontakt">K</TextLink>));
    expect(dark).toContain("text-tannengruen");
    expect(dark).not.toContain("focus-ring-light");

    const light = classesOf(
      render(
        <TextLink href="/kontakt" tone="light">
          K
        </TextLink>,
      ),
    );
    expect(light).toEqual(
      expect.arrayContaining(["text-papier", "focus-ring-light"]),
    );
    expect(light).not.toContain("text-tannengruen");
  });
});

describe("design tokens in ui components", () => {
  const html = [
    render(<Container>x</Container>),
    ...LEVELS.map((level) => render(<Heading level={level}>x</Heading>)),
    ...VARIANTS.map((variant) => render(<Button variant={variant}>x</Button>)),
    render(<TextLink href="/">x</TextLink>),
    render(
      <TextLink href="/" tone="light">
        x
      </TextLink>,
    ),
    render(<TextInput id="a" label="A" hint="h" error="e" optional />),
    render(<TextInput id="b" label="B" />),
    render(<TextArea id="c" label="C" error="e" />),
    render(<Select id="d" label="D" options={[{ value: "1", label: "1" }]} />),
    render(<Checkbox id="e" label="E" error="e" />),
    render(<ErrorSummary errors={[{ fieldId: "a", message: "m" }]} />),
    render(<VacationBanner from="2026-12-23" to="2027-01-06" />),
    render(
      <Footer
        company={{
          name: "n",
          street: "s",
          postalCode: "p",
          city: "c",
          phone: "089 99998 412",
          email: "info@tannrieder.example",
        }}
        openingHours={[{ days: "d", hours: "h" }]}
      />,
    ),
    render(<LocaleSwitcher />),
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
      if (kind === "border" && /^[trblxy](-\d+)?$/.test(value)) return false; // sides: border-t
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
