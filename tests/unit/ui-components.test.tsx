import { readdirSync, readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  ArrowRightIcon,
  CloseIcon,
  ErrorIcon,
  MenuIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
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
}));

describe("Button", () => {
  it("is a primary 52px button by default and never submits by accident", () => {
    const html = render(<Button>Projekt anfragen</Button>);

    expect(html).toMatch(/^<button type="button"/);
    expect(classesOf(html)).toEqual(
      expect.arrayContaining([
        "min-h-13",
        "px-6.5",
        "bg-tannengruen",
        "text-weiss",
        "hover:bg-tannengruen-dunkel",
        "rounded",
        "font-bold",
      ]),
    );
  });

  it("takes the type of a form button", () => {
    expect(render(<Button type="submit">Senden</Button>)).toMatch(
      /^<button type="submit"/,
    );
  });

  it("secondary has a 2px Tannengrün frame and the same total padding", () => {
    expect(
      classesOf(render(<Button variant="secondary">Jobs bei uns</Button>)),
    ).toEqual(
      expect.arrayContaining([
        "border-2",
        "border-tannengruen",
        "text-tannengruen",
        "px-6",
        "hover:border-tannengruen-dunkel",
      ]),
    );
  });

  it("text has no frame, no background and no side padding", () => {
    const classes = classesOf(render(<Button variant="text">Mehr</Button>));

    expect(classes).toEqual(
      expect.arrayContaining(["underline", "px-0", "text-tannengruen"]),
    );
    expect(classes).not.toContain("bg-tannengruen");
    expect(classes).not.toContain("border-2");
  });

  it("is 48px in the header and 44px as the menu button", () => {
    expect(
      classesOf(render(<Button size="header">Projekt anfragen</Button>)),
    ).toEqual(expect.arrayContaining(["min-h-12", "text-small", "px-5.5"]));
    expect(classesOf(render(<Button variant="menu">Menü</Button>))).toEqual(
      expect.arrayContaining([
        "min-h-11",
        "border",
        "border-feldrand",
        "bg-weiss",
        "text-graphit",
      ]),
    );
  });

  it("can take the whole width and carry an icon before the label", () => {
    const html = render(
      <Button fullWidth icon={<PhoneIcon />}>
        Anrufen
      </Button>,
    );

    expect(classesOf(html)).toContain("w-full");
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("Anrufen"));
  });

  it("passes attributes through", () => {
    expect(
      render(
        <Button variant="menu" aria-expanded="false">
          Menü
        </Button>,
      ),
    ).toContain('aria-expanded="false"');
  });
});

describe("ButtonLink", () => {
  it("is a plain anchor for a phone number, an e-mail address and an anchor", () => {
    expect(
      render(<ButtonLink href="tel:+498999998412">Anrufen</ButtonLink>),
    ).toMatch(/^<a [^>]*href="tel:\+498999998412"/);
    expect(
      render(<ButtonLink href="mailto:a@b.example">Mail</ButtonLink>),
    ).toContain('href="mailto:a@b.example"');
    expect(render(<ButtonLink href="#projekte">Weiter</ButtonLink>)).toContain(
      'href="#projekte"',
    );
  });

  it("looks like the button of the same variant", () => {
    expect(
      classesOf(
        render(
          <ButtonLink href="#" variant="secondary">
            Jobs bei uns
          </ButtonLink>,
        ),
      ),
    ).toEqual(expect.arrayContaining(["border-2", "min-h-13", "no-underline"]));
  });

  it("goes through next-intl's Link for a page of the site", () => {
    const page = render(<ButtonLink href="/kontakt">Kontakt</ButtonLink>);

    expect(page).toContain("data-intl-link");
    expect(page).toContain('href="/kontakt"');
  });

  it("does not use it for anything that leaves the router", () => {
    for (const href of [
      "tel:+498999998412",
      "mailto:a@b.example",
      "#projekte",
      "https://example.org/",
    ] as const) {
      expect(render(<ButtonLink href={href}>x</ButtonLink>)).not.toContain(
        "data-intl-link",
      );
    }
  });
});

describe("TextLink", () => {
  it("is bold by default", () => {
    expect(
      classesOf(render(<TextLink href="#">Alle Referenzen ansehen</TextLink>)),
    ).toContain("font-bold");
  });

  it("plain has no extra classes, the base styles for links do the work", () => {
    expect(
      render(
        <TextLink href="#" tone="plain">
          Mail
        </TextLink>,
      ),
    ).not.toContain("class=");
  });

  it("muted is small and Schiefer", () => {
    expect(
      classesOf(
        render(
          <TextLink href="#" tone="muted">
            Animation überspringen
          </TextLink>,
        ),
      ),
    ).toEqual(expect.arrayContaining(["text-xs", "text-schiefer"]));
  });
});

describe("Container", () => {
  it("is 1280px wide with the fluid side margin", () => {
    expect(classesOf(render(<Container>x</Container>))).toEqual([
      "mx-auto",
      "max-w-page",
      "px-gutter",
    ]);
  });
});

describe("Section", () => {
  it("is named by its heading", () => {
    expect(render(<Section labelledBy="a-titel">x</Section>)).toMatch(
      /^<section aria-labelledby="a-titel"/,
    );
  });

  it("keeps 128px above on the desktop and 64px on the phone", () => {
    expect(classesOf(render(<Section labelledBy="a">x</Section>))).toEqual([
      "pt-16",
      "md:pt-32",
    ]);
  });

  it("moos is a Moos band", () => {
    expect(
      classesOf(
        render(
          <Section variant="moos" labelledBy="a">
            x
          </Section>,
        ),
      ),
    ).toEqual(
      expect.arrayContaining(["bg-moos", "md:py-24", "md:mt-32", "mt-16"]),
    );
  });

  it("line is white with a Linie line on top", () => {
    expect(
      classesOf(
        render(
          <Section variant="line" labelledBy="a">
            x
          </Section>,
        ),
      ),
    ).toEqual(expect.arrayContaining(["bg-weiss", "border-t", "border-linie"]));
  });

  it("can drop the space above for a section that sets its own", () => {
    expect(
      classesOf(
        render(
          <Section labelledBy="a" topSpace="none" className="pt-14">
            x
          </Section>,
        ),
      ),
    ).toEqual(["pt-14"]);
  });
});

describe("SectionHeading", () => {
  it("is an h2 with the id the section points at", () => {
    const html = render(
      <SectionHeading id="leistungen-titel" title="Was wir bauen" />,
    );

    expect(html).toContain('<h2 id="leistungen-titel"');
    expect(html).toContain(">Was wir bauen</h2>");
    expect(html).not.toContain("<p");
    expect(html).not.toContain("<a");
  });

  it("shows the introduction in Schiefer under the title", () => {
    const html = render(
      <SectionHeading id="a" title="Titel" intro="Alles entsteht bei uns." />,
    );

    expect(html).toMatch(
      /<p class="[^"]*text-schiefer[^"]*">Alles entsteht bei uns\.<\/p>/,
    );
    expect(html.indexOf("Titel")).toBeLessThan(html.indexOf("Alles entsteht"));
  });

  it("puts the link in the title row, after the title", () => {
    const html = render(
      <SectionHeading
        id="a"
        title="Ausgewählte Projekte"
        link={{ href: "#", label: "Alle Referenzen ansehen" }}
      />,
    );

    expect(html).toContain("justify-between");
    expect(html.indexOf("Ausgewählte Projekte")).toBeLessThan(
      html.indexOf("Alle Referenzen ansehen"),
    );
    expect(html).toMatch(/<a [^>]*>Alle Referenzen ansehen<\/a>/);
  });
});

describe("StepNumber", () => {
  it("is hidden from assistive technology, the list counts the steps", () => {
    expect(render(<StepNumber value={1} />)).toMatch(
      /^<span aria-hidden="true"/,
    );
  });

  it("is 32px by default and 44px with the Zilla Slab number", () => {
    expect(classesOf(render(<StepNumber value={1} />))).toEqual(
      expect.arrayContaining(["size-8", "text-xs", "rounded-full"]),
    );
    expect(classesOf(render(<StepNumber value={1} size={44} />))).toEqual(
      expect.arrayContaining(["size-11", "font-display", "text-h4"]),
    );
  });

  it("has three states: regular, active, muted", () => {
    expect(classesOf(render(<StepNumber value={1} />))).toEqual(
      expect.arrayContaining(["border-2", "border-tannengruen"]),
    );
    expect(classesOf(render(<StepNumber value={1} state="active" />))).toEqual(
      expect.arrayContaining(["bg-tannengruen", "text-weiss"]),
    );
    expect(classesOf(render(<StepNumber value={1} state="muted" />))).toEqual(
      expect.arrayContaining(["border-linie", "text-schiefer"]),
    );
  });
});

describe("icons", () => {
  const icons = {
    PhoneIcon,
    MenuIcon,
    CloseIcon,
    ArrowRightIcon,
    ErrorIcon,
  };

  it.each(Object.entries(icons))(
    "%s: 2px line in the text color, hidden from assistive technology",
    (_name, Icon) => {
      const html = render(<Icon />);

      expect(html).toContain('stroke-width="2"');
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('width="20"');
    },
  );

  it("takes a size", () => {
    expect(render(<ArrowRightIcon size={22} />)).toMatch(
      /width="22" height="22"/,
    );
  });
});

describe("ui components use the tokens only", () => {
  const dir = "src/components/ui";
  const files = readdirSync(dir).filter((name) => name.endsWith(".tsx"));

  it.each(files)("%s has no color values of its own", (name) => {
    const source = readFileSync(`${dir}/${name}`, "utf8");

    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\b(?:rgb|hsl)a?\(/);
  });
});
