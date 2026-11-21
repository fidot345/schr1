import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { PageNotFound } from "@/components/errors/PageNotFound";
import { LegalPage } from "@/components/legal/LegalPage";
import type {
  ContactDetails as ContactData,
  RichTextState,
} from "@/lib/content";
import { render, tagWithId } from "./support/render";

/* next-intl's Link needs a Next.js request: here it is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const count = (html: string, pattern: RegExp): number =>
  html.match(pattern)?.length ?? 0;

const CONTACT: ContactData = {
  company: {
    name: "Schreinerei Tannrieder",
    logoWord: "Tannrieder",
    owner: "Johannes Tannrieder",
    street: "Werkstattweg 4",
    postalCode: "85999",
    city: "Wendelfing",
    phone: "089 99998 412",
    email: "info@tannrieder.example",
  },
  openingHours: [
    { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
    { id: "b", days: "Fr", hours: "7:00–12:00" },
  ],
  serviceArea: ["Im Umkreis von etwa 40 km.", "Mit eigenem Team."],
  vacation: null,
};

const text = (value: string, format = 0) => ({
  type: "text",
  version: 1,
  text: value,
  format,
});

const block = (type: string, children: unknown[], extra = {}) => ({
  type,
  version: 1,
  children,
  ...extra,
});

const state = (...children: unknown[]): RichTextState => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: children as RichTextState["root"]["children"],
  },
});

const LEGAL = state(
  block("heading", [text("Konzeptprojekt")], { tag: "h1" }),
  block("paragraph", [text("Erster Absatz mit "), text("fett", 1)]),
  block("paragraph", []),
  block("heading", [text("Kleiner")], { tag: "h3" }),
  block(
    "list",
    [
      block("listitem", [text("Hosting")], { value: 1 }),
      block("listitem", [text("Formulare")], { value: 2 }),
    ],
    { tag: "ul", listType: "bullet" },
  ),
  block(
    "paragraph",
    [
      block("link", [text("Vercel")], {
        fields: { linkType: "custom", url: "https://vercel.com", newTab: true },
      }),
      text(" und "),
      block("link", [text("eine Seite")], {
        fields: { linkType: "internal", doc: { relationTo: "services" } },
      }),
    ],
    {},
  ),
  { type: "upload", version: 1, value: 4, relationTo: "media" },
);

describe("ContactDetails", () => {
  it("is the page's h1 with the lead text", () => {
    const html = render(<ContactDetails {...CONTACT} />);

    expect(count(html, /<h1/g)).toBe(1);
    expect(tagWithId(html, "kontakt-titel")).toContain("text-h1");
    expect(html).toContain('aria-labelledby="kontakt-titel"');
    expect(html).toContain(">Kontakt</h1>");
    expect(html).toContain("Am schnellsten erreichen Sie uns telefonisch");
  });

  it("calls through tel:, writes through mailto: and has the address", () => {
    const html = render(<ContactDetails {...CONTACT} />);

    expect(html).toMatch(
      /<a href="tel:\+498999998412" class="[^"]*text-tel-lg[^"]*">089 99998 412<\/a>/,
    );
    expect(html).toContain(
      '<a href="mailto:info@tannrieder.example">info@tannrieder.example</a>',
    );
    expect(html).toContain(
      "Schreinerei Tannrieder<br/>Werkstattweg 4<br/>85999 Wendelfing</address>",
    );
  });

  it("has the hours with 'Uhr', where we work and the request button", () => {
    const html = render(<ContactDetails {...CONTACT} />);

    expect(html).toContain("Öffnungszeiten</h2>");
    expect(html).toContain(
      '<dt class="font-bold">Mo–Do</dt><dd>7:00–16:30 Uhr</dd>',
    );
    expect(html).toContain("Wo wir arbeiten</h2>");
    expect(html).toContain("Im Umkreis von etwa 40 km.</p>");
    expect(html).toContain("Mit eigenem Team.</p>");
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<form");
  });

  it("leaves out 'where we work' when the field is empty", () => {
    const html = render(<ContactDetails {...CONTACT} serviceArea={[]} />);

    expect(html).not.toContain("Wo wir arbeiten");
  });

  it("is in English on /en, without 'Uhr'", () => {
    const html = render(
      <ContactDetails
        {...CONTACT}
        openingHours={[{ id: "a", days: "Mon–Thu", hours: "7:00–16:30" }]}
      />,
      "en",
    );

    expect(html).toContain(">Contact</h1>");
    expect(html).toContain("<dd>7:00–16:30</dd>");
    expect(html).toContain("Opening hours</h2>");
    expect(html).toContain("Where we work</h2>");
    expect(html).toContain(">Request a project</a>");
  });
});

describe("LegalPage", () => {
  it("is the page's h1, and a heading of the text is at most an h2", () => {
    const html = render(
      <LegalPage titleId="impressum-titel" title="Impressum" body={LEGAL} />,
    );

    expect(count(html, /<h1/g)).toBe(1);
    expect(tagWithId(html, "impressum-titel")).toContain("text-h1");
    expect(html).toContain('aria-labelledby="impressum-titel"');
    expect(html).toMatch(/<h2 class="[^"]*text-h3[^"]*">Konzeptprojekt<\/h2>/);
    expect(html).toMatch(/<h3 class="[^"]*text-h4[^"]*">Kleiner<\/h3>/);
  });

  it("has the paragraphs, lists and formatting, and no empty paragraph", () => {
    const html = render(
      <LegalPage titleId="impressum-titel" title="Impressum" body={LEGAL} />,
    );

    expect(html).toContain(
      '<p class="mt-4">Erster Absatz mit <strong>fett</strong></p>',
    );
    expect(html).not.toContain("<p><br/></p>");
    expect(html).toMatch(/<ul class="[^"]*list-disc[^"]*">/);
    expect(count(html, /<li/g)).toBe(2);
    expect(html).toContain("max-w-[34em]");
  });

  it("links to the web, but not to documents or photos", () => {
    const html = render(
      <LegalPage titleId="impressum-titel" title="Impressum" body={LEGAL} />,
    );

    expect(html).toContain(
      '<a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a>',
    );
    expect(html).toContain(" und eine Seite</p>");
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("<img");
  });

  it("puts the concept note in a Moos box above the text when asked", () => {
    const plain = render(
      <LegalPage
        titleId="datenschutz-titel"
        title="Datenschutz"
        body={LEGAL}
      />,
    );
    const withNote = render(
      <LegalPage
        titleId="impressum-titel"
        title="Impressum"
        body={LEGAL}
        conceptNote
      />,
    );

    expect(plain).not.toContain("Konzeptprojekt – ");
    expect(withNote).toMatch(
      /<p class="[^"]*bg-moos[^"]*font-bold[^"]*">Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.<\/p>/,
    );
    expect(withNote.indexOf("bg-moos")).toBeLessThan(
      withNote.indexOf(">Konzeptprojekt</h2>"),
    );
  });

  it("writes the concept note in English on /en", () => {
    const html = render(
      <LegalPage
        titleId="impressum-titel"
        title="Imprint"
        body={LEGAL}
        conceptNote
      />,
      "en",
    );

    expect(html).toContain(
      "Concept project – Schreinerei Tannrieder is a fictitious company.",
    );
  });
});

describe("PageNotFound", () => {
  it("is one h1 with a short text and three ways on", () => {
    const html = render(<PageNotFound />);

    expect(count(html, /<h1/g)).toBe(1);
    expect(tagWithId(html, "nicht-gefunden-titel")).toContain("text-h1");
    expect(html).toContain(">Seite nicht gefunden</h1>");
    expect(html).toMatch(/<a href="\/"[^>]*>Zur Startseite<\/a>/);
    expect(html).toMatch(/<a href="\/leistungen"[^>]*>Unsere Leistungen<\/a>/);
    expect(html).toMatch(/<a href="\/kontakt"[^>]*>Kontakt aufnehmen<\/a>/);
  });

  it("is in English on /en", () => {
    const html = render(<PageNotFound />, "en");

    expect(html).toContain(">Page not found</h1>");
    expect(html).toContain(">Go to the home page</a>");
    expect(html).toContain(">Our services</a>");
    expect(html).toContain(">Get in touch</a>");
  });
});
