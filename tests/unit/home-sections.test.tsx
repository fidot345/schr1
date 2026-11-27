import { existsSync, readFileSync } from "node:fs";
import type { ReactNode } from "react";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { Jobs } from "@/components/home/Jobs";
import { Process } from "@/components/home/Process";
import { Projects } from "@/components/home/Projects";
import { Services } from "@/components/home/Services";
import { Testimonials } from "@/components/home/Testimonials";
import { WardrobeSection } from "@/components/wardrobe/WardrobeSection";
import { WardrobeStill } from "@/components/wardrobe/WardrobeStill";
import type {
  CompanyData,
  FeaturedProject,
  HomeContent,
  JobListItem,
  ServiceCard,
  TestimonialItem,
} from "@/lib/content";
import type { Photo } from "@/lib/media";
import { sceneStep } from "@/lib/text";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { classesOf, render, tagWithId } from "./support/render";

/* next-intl's Link needs a Next.js request: here it is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    className,
    children,
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
    className?: string;
    children: ReactNode;
  }) => (
    <a
      href={
        typeof href === "string"
          ? href
          : href.pathname.replace(
              /\[(\w+)\]/g,
              (_, key: string) => href.params?.[key] ?? "",
            )
      }
      className={className}
    >
      {children}
    </a>
  ),
}));

/*
 * The sections with data in the shape src/lib/content.ts reads from
 * Payload; the texts are those of seed/data.ts.
 */

const count = (html: string, pattern: RegExp): number =>
  html.match(pattern)?.length ?? 0;

const photo = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Foto ${name}`,
  width: 2400,
  height: 1600,
  position: "50% 30%",
});

/** The <img> tags of the markup. */
const images = (html: string): string[] => html.match(/<img [^>]*>/g) ?? [];

const hero: HomeContent["hero"] = {
  title: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
  text: "Küchen, Einbauschränke, Türen und Innenausbau – geplant, gebaut und montiert von unserem Team.",
  photo: photo("hero-1"),
  facts: [
    { id: "a", highlight: "Meisterbetrieb", text: "seit 1989" },
    { id: "b", highlight: "Neun Leute", text: "in der eigenen Werkstatt" },
    { id: "c", highlight: "Montage", text: "im Umkreis von 40 km" },
  ],
};

const services: ServiceCard[] = [
  ["kuechen", "Küchen"],
  ["schraenke-und-moebel", "Schränke & Möbel"],
  ["tueren", "Türen"],
  ["innenausbau", "Innenausbau"],
].map(([slug, title], index) => ({
  id: index + 1,
  slug,
  title,
  summary: `${title}: eine Zeile.`,
  photo: photo(slug),
}));

const CAPTIONS = [
  "Zuschnitt: Jedes Teil wird in unserer Werkstatt millimetergenau zugeschnitten.",
  "Korpus: Seiten, Boden und Deckel werden verleimt und verschraubt.",
  "Innenleben: Rückwand, Fachböden und Kleiderstange kommen hinein.",
  "Fronten: Die Türen werden eingepasst und ausgerichtet.",
  "Montage: Wir bauen bei Ihnen ein – sauber und pünktlich.",
  "Fertig. Vom Aufmaß bis zur Montage in 8–10 Wochen.",
];
/** The button of the last step, as in the admin panel. */
const BUTTON = "Projekt anfragen";

const sceneSteps = CAPTIONS.map((caption, index) => ({
  id: String(index),
  ...sceneStep(caption),
}));

const project = (
  id: number,
  slug: string,
  title: string,
  objectType: string,
  year: number,
  duration: string,
): FeaturedProject => ({
  id,
  slug,
  title,
  objectType,
  year,
  duration,
  photo: photo(slug),
});

const featuredProjects = [
  project(
    1,
    "wohnkueche-in-eiche",
    "Wohnküche in Eiche",
    "Einfamilienhaus",
    2025,
    "9 Wochen",
  ),
  project(
    2,
    "einbauschrank-unter-der-dachschraege",
    "Einbauschrank unter der Dachschräge",
    "Dachgeschosswohnung",
    2025,
    "6 Wochen",
  ),
  project(
    3,
    "innentueren-fuer-einen-altbau",
    "Innentüren für einen Altbau",
    "Altbau",
    2024,
    "8 Wochen",
  ),
];

const processSteps = [
  "Aufmaß vor Ort",
  "Entwurf und Angebot",
  "Fertigung in der Werkstatt",
  "Montage",
].map((title, index) => ({ id: String(index), title, text: `${title}.` }));

const job = (id: number, slug: string, title: string): JobListItem => ({
  id,
  slug,
  title,
  employmentType: "full_time",
  start: "ab sofort",
  hours: "Mo–Do 7:00–16:30, Fr 7:00–12:00",
  pay: { text: null, salary: { min: 19, max: 23, unit: "hour" } },
});

const jobs = [
  job(1, "schreiner", "Schreiner (m/w/d)"),
  job(2, "monteur", "Monteur für Möbel und Küchen (m/w/d)"),
  {
    ...job(3, "ausbildung-schreiner", "Ausbildung zum Schreiner (m/w/d)"),
    employmentType: "apprenticeship" as const,
    start: "September 2027",
    pay: {
      text: "1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
      salary: null,
    },
  },
];

const testimonials: TestimonialItem[] = [
  {
    id: 1,
    quote: "Die Küche passt auf den Zentimeter.",
    author: "Familie K., Einfamilienhaus",
  },
  {
    id: 2,
    quote: "Jetzt ist es das ordentlichste Zimmer.",
    author: "Sabine M., Dachgeschosswohnung",
  },
  {
    id: 3,
    quote: "Alle schließen sauber.",
    author: "Thomas und Eva R., Altbau",
  },
];

const company: CompanyData = {
  name: "Schreinerei Tannrieder",
  logoWord: "Tannrieder",
  owner: "Johannes Tannrieder",
  street: "Werkstattweg 4",
  postalCode: "85999",
  city: "Wendelfing",
  phone: "089 99998 412",
  email: "info@tannrieder.example",
};

const openingHours = [
  { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
  { id: "b", days: "Fr", hours: "7:00–12:00" },
];

const serviceArea = [
  "Wir arbeiten im Umkreis von etwa 40 km um Wendelfing. Aufmaß, Fertigung und Montage machen wir mit unserem eigenen Team.",
];

describe("Hero", () => {
  const html = render(<Hero {...hero} />);

  it("names the section by the h1, with the id of the mockup", () => {
    expect(html).toContain('aria-labelledby="hero-titel"');
    expect(html).toMatch(/<h1 id="hero-titel"[^>]*>Möbel nach Maß/);
  });

  it("has the two buttons, request first and jobs second", () => {
    const request = html.indexOf(">Projekt anfragen<");
    const jobsButton = html.indexOf(">Jobs bei uns<");

    expect(request).toBeGreaterThan(0);
    expect(jobsButton).toBeGreaterThan(request);
    expect(html).toContain('href="/anfrage"');
    expect(html).toContain('href="/karriere"');
  });

  it("shows the photo from Payload first, with its alt text and focal point", () => {
    const [image] = images(html);

    expect(images(html)).toHaveLength(1);
    expect(image).toContain('alt="Foto hero-1"');
    expect(image).toContain('loading="eager"');
    expect(image).toContain('fetchPriority="high"');
    expect(image).toContain("object-position:50% 30%");
  });

  it("puts the photo first below lg and runs it edge to edge on the phone", () => {
    const frame = html.match(/<div class="[^"]*order-first[^"]*">/)?.[0] ?? "";

    expect(frame).toContain("-mx-gutter");
    expect(frame).toContain("max-md:rounded-none");
    expect(frame).toContain("lg:order-none");
  });

  it("lists the facts with the highlighted part in bold", () => {
    expect(count(html, /<strong /g)).toBe(3);
    expect(html).toMatch(/>Meisterbetrieb<\/strong> seit 1989/);
    expect(html).toContain("im Umkreis von 40 km");
  });

  it("leaves the line of facts out when there are none", () => {
    const bare = render(<Hero {...hero} facts={[]} />);

    expect(bare).not.toContain("<ul");
    expect(bare).not.toContain("border-linie");
  });
});

describe("Services", () => {
  const html = render(<Services services={services} />);

  it("has the heading and the intro from messages", () => {
    expect(html).toContain('aria-labelledby="leistungen-titel"');
    expect(html).toMatch(/<h2 id="leistungen-titel"[^>]*>Was wir bauen</);
    expect(html).toContain(de.HomePage.servicesIntro);
  });

  it("shows a card per service, each a link with its photo and an h3", () => {
    expect(count(html, /<li>/g)).toBe(4);
    expect(count(html, /<h3 /g)).toBe(4);
    expect(images(html)).toHaveLength(4);
    expect(count(html, /aspect-4\/3/g)).toBe(4);
    expect(html).toContain('href="/leistungen/kuechen"');
    expect(html).toContain("Küchen: eine Zeile.");
  });

  it("loads the photos lazily: they are below the first screen", () => {
    for (const image of images(html)) {
      expect(image).toContain('loading="lazy"');
    }
  });

  it("speaks English on /en", () => {
    const english = render(<Services services={services} />, "en");

    expect(english).toContain("What we build");
    expect(english).toContain(en.HomePage.servicesIntro);
  });
});

describe("WardrobeStill", () => {
  const html = render(
    <WardrobeStill steps={sceneSteps} buttonLabel={BUTTON} activeStep={3} />,
  );

  it("starts with the link that skips the animation, to the projects", () => {
    expect(html).toContain('href="#projekte"');
    expect(html).toContain("Animation überspringen");
    expect(html.indexOf("Animation überspringen")).toBeLessThan(
      html.indexOf("<h2"),
    );
  });

  it("shows the finished wardrobe with an alt text and the intro from messages", () => {
    const [image] = images(html);

    expect(image).toContain('src="/images/3d/schrank-fertig.avif"');
    expect(image).toContain(`alt="${de.HomePage.sceneImageAlt}"`);
    expect(html).toContain(de.HomePage.sceneIntro);
  });

  it("shows each caption as the step's name and its text", () => {
    expect(count(html, /<li /g)).toBe(6);
    expect(html).toMatch(/>Zuschnitt<\/p><p class="text-small">Jedes Teil/);
    expect(html).toMatch(/>Fertig<\/p><p class="text-small">Vom Aufmaß/);
    expect(html).not.toContain("Zuschnitt:");
  });

  it("marks only the active step", () => {
    expect(count(html, /aria-current="step"/g)).toBe(1);
    expect(html).toMatch(/aria-current="step"[^>]*>.*?Innenleben/);
    expect(count(html, /rounded-full[^"]*bg-tannengruen/g)).toBe(1);

    const first = render(
      <WardrobeStill steps={sceneSteps} buttonLabel={BUTTON} activeStep={1} />,
    );
    expect(first).toMatch(/aria-current="step"[^>]*>.*?Zuschnitt/);
  });

  it("marks no step as the fallback of the scene", () => {
    const fallback = render(
      <WardrobeStill steps={sceneSteps} buttonLabel={BUTTON} />,
    );

    expect(fallback).not.toContain("aria-current");
    expect(count(fallback, /<li /g)).toBe(6);
  });

  it("ends with the button to the request form, always in view", () => {
    const button = html.match(/<a href="\/anfrage"[^>]*>([^<]*)<\/a>/);

    expect(button?.[1]).toBe(BUTTON);
    expect(button?.[0]).not.toContain("invisible");
    expect(html.indexOf('href="/anfrage"')).toBeGreaterThan(
      html.indexOf("</ol>"),
    );
  });

  it("shows only the text of a caption without a name", () => {
    const plain = render(
      <WardrobeStill
        steps={[{ id: "x", ...sceneStep("Ohne Namen davor") }]}
        buttonLabel={BUTTON}
        activeStep={1}
      />,
    );

    expect(plain).toContain('<p class="text-small">Ohne Namen davor</p>');
    expect(plain).not.toContain("text-h4");
  });

  it("names the section by the h2, by another id where asked", () => {
    expect(html).toContain('aria-labelledby="szene-titel"');
    expect(tagWithId(html, "szene-titel")).toMatch(/^<h2 /);

    const other = render(
      <WardrobeStill
        steps={sceneSteps}
        buttonLabel={BUTTON}
        headingId="szene-titel-bild"
      />,
    );
    expect(other).toContain('aria-labelledby="szene-titel-bild"');
    expect(tagWithId(other, "szene-titel-bild")).toMatch(/^<h2 /);
    expect(other).not.toContain('id="szene-titel"');
  });
});

describe("WardrobeSection", () => {
  // The server's markup: the still picture for browsers without
  // JavaScript, then the panel of the scene with the finished wardrobe in place.
  const html = render(
    <WardrobeSection steps={sceneSteps} buttonLabel={BUTTON} />,
  );
  const closing = "</noscript>";
  const fallback = html.slice(0, html.indexOf(closing) + closing.length);
  const panel = html.slice(fallback.length);

  it("starts with the link that skips the animation, to the projects", () => {
    expect(panel).toContain('href="#projekte"');
    expect(panel.indexOf("Animation überspringen")).toBeLessThan(
      panel.indexOf("<h2"),
    );
  });

  it("names the section by the h2 and has the intro from messages", () => {
    expect(panel).toMatch(/^<section [^>]*aria-labelledby="szene-titel"/);
    expect(tagWithId(panel, "szene-titel")).toMatch(/^<h2 /);
    expect(panel).toContain(de.HomePage.sceneIntro);
  });

  it("shows the finished wardrobe until the scene is there, and no canvas yet", () => {
    const [image] = images(panel);

    expect(image).toContain('src="/images/3d/schrank-fertig.avif"');
    expect(image).toContain(`alt="${de.HomePage.sceneImageAlt}"`);
    expect(html).not.toContain("<canvas");
  });

  it("lists all six captions and marks the first step", () => {
    expect(panel).toMatch(/<ol [^>]*>(<li [^>]*>.*?<\/li>){6}<\/ol>/);
    expect(count(panel, /aria-current="step"/g)).toBe(1);
    expect(panel).toMatch(/aria-current="step"[^>]*>.*?Zuschnitt/);
  });

  it("keeps the other captions for screen readers on a phone", () => {
    const hidden = panel.match(/<li [^>]*max-md:sr-only[^>]*>/g) ?? [];

    expect(hidden).toHaveLength(5);
    expect(hidden.join("")).not.toContain("aria-current");
  });

  it("shows the other steps by their name only on a low screen, their text for screen readers", () => {
    const items = panel.match(/<li [^>]*>.*?<\/li>/g) ?? [];
    const lowText = (item: string) =>
      /<p class="[^"]*\blow-screen:sr-only\b[^"]*">/.test(item);

    expect(items).toHaveLength(6);
    expect(items.map(lowText)).toEqual([false, true, true, true, true, true]);
  });

  it("keeps the button to the request form hidden until the wardrobe is finished", () => {
    const button = panel.match(/<a href="\/anfrage"[^>]*>([^<]*)<\/a>/);

    expect(button?.[1]).toBe(BUTTON);
    expect(button?.[0]).toMatch(/class="[^"]*\binvisible\b/);
    // After the captions, so a screen reader comes to it last.
    expect(panel.indexOf('href="/anfrage"')).toBeGreaterThan(
      panel.indexOf("</ol>"),
    );
  });

  it("has the still picture for browsers without JavaScript and hides the panel there", () => {
    expect(fallback).toMatch(/^<noscript><section [^>]*>/);
    expect(count(fallback, /<li /g)).toBe(6);
    expect(fallback).not.toContain("aria-current");
    expect(fallback).toContain('href="#projekte"');
    expect(images(fallback)[0]).toContain("schrank-fertig.avif");
    expect(fallback).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
    expect(fallback).toContain('aria-labelledby="szene-titel-bild"');
    expect(panel).toMatch(/^<section [^>]*class="[^"]*\bnoscript:hidden\b/);
    // One heading id each: the page never has two "szene-titel".
    expect(count(html, /id="szene-titel"/g)).toBe(1);
  });

  it("speaks English on /en", () => {
    const english = render(
      <WardrobeSection steps={sceneSteps} buttonLabel="Request a project" />,
      "en",
    );

    expect(english).toContain("Skip animation");
    expect(english).toContain(en.HomePage.sceneTitle);
    expect(english).toContain(">Request a project</a>");
  });
});

describe("Projects", () => {
  const html = render(<Projects projects={featuredProjects} />);

  it("is the target of the skip link and names itself by the h2", () => {
    expect(html).toMatch(
      /<section id="projekte" aria-labelledby="projekte-titel"/,
    );
    expect(tagWithId(html, "projekte-titel")).toMatch(/^<h2 /);
  });

  it("links to all projects", () => {
    expect(html).toMatch(/href="\/referenzen"[^>]*>Alle Referenzen ansehen</);
  });

  it("has one large card (h3 step) and two small ones (h4 step), each with its photo", () => {
    expect(count(html, /<h3 /g)).toBe(3);
    expect(count(html, /class="[^"]*text-h3[^"]*"/g)).toBe(1);
    expect(count(html, /class="[^"]*text-h4[^"]*"/g)).toBe(2);
    expect(images(html)).toHaveLength(3);
    expect(html).toContain('alt="Foto wohnkueche-in-eiche"');
    expect(html).toContain('href="/referenzen/wohnkueche-in-eiche"');
  });

  it("writes the facts with the duration", () => {
    expect(html).toContain("Einfamilienhaus, 2025, 9 Wochen");
    expect(html).toContain("Altbau, 2024, 8 Wochen");
  });

  it("keeps the section, the skip link's target, without projects", () => {
    const empty = render(<Projects projects={[]} />);

    expect(empty).toContain('id="projekte"');
    expect(empty).not.toContain("<h3");
  });
});

describe("Process", () => {
  const html = render(
    <Process steps={processSteps} note={de.HomePage.processNote} />,
  );

  it("is a Moos band named by the h2 from messages", () => {
    expect(html).toMatch(/<section aria-labelledby="ablauf-titel"/);
    expect(classesOf(html)).toContain("bg-moos");
    expect(tagWithId(html, "ablauf-titel")).toMatch(/^<h2 /);
    expect(html).toMatch(/<h2 id="ablauf-titel"[^>]*>So läuft Ihr Auftrag</);
  });

  it("lists four steps, each a number, an h3 and a text", () => {
    expect(count(html, /<li /g)).toBe(4);
    expect(count(html, /<h3 /g)).toBe(4);
    expect(count(html, /aria-hidden="true"[^>]*>[1-4]</g)).toBe(4);
    expect(html).toContain("Aufmaß vor Ort");
  });

  it("ends with the duration and the request button", () => {
    expect(html).toContain("vergehen meist 8 bis 10 Wochen");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
  });
});

describe("Jobs", () => {
  const html = render(
    <Jobs
      title="Wir suchen Verstärkung"
      paragraphs={["Für Werkstatt und Montage suchen wir Verstärkung."]}
      photo={photo("karriere")}
      jobs={jobs}
    />,
  );

  it("names itself by the h2 from Payload and puts the photo before the text", () => {
    expect(html).toContain('aria-labelledby="jobs-titel"');
    expect(html).toMatch(/<h2 id="jobs-titel"[^>]*>Wir suchen Verstärkung</);
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("<h2"));
    expect(html).toContain('alt="Foto karriere"');
    expect(html).toContain("Für Werkstatt und Montage");
  });

  it("lists the open positions as links with type, start and pay", () => {
    expect(count(html, /<li /g)).toBe(3);
    expect(html).toContain('href="/karriere/schreiner"');
    expect(html).toContain('href="/karriere/ausbildung-schreiner"');
    expect(html).toContain("Vollzeit, ab sofort, 19–23 € pro Stunde");
    expect(html).toContain("Ausbildung, September 2027, 1. Jahr 900 €");
    expect(count(html, /<svg /g)).toBe(3);
  });

  it("has the two buttons, the main one first", () => {
    const all = html.indexOf(">Offene Stellen ansehen<");
    const trial = html.indexOf(">Schnuppertag anfragen<");

    expect(all).toBeGreaterThan(0);
    expect(trial).toBeGreaterThan(all);
  });

  it("keeps the buttons and drops the list without open positions", () => {
    const none = render(
      <Jobs title="Karriere" paragraphs={[]} photo={null} jobs={[]} />,
    );

    expect(none).not.toContain("<ul");
    expect(none).toContain(">Offene Stellen ansehen<");
  });
});

describe("AboutTeaser", () => {
  const html = render(
    <AboutTeaser
      title="Familienbetrieb seit 1989"
      paragraphs={[
        "Georg Tannrieder hat die Werkstatt 1989 in Wendelfing gegründet.",
        "Wir arbeiten im Umkreis von etwa 40 km.",
      ]}
      photo={photo("about-werkstatt")}
    />,
  );

  it("names itself by the h2 from Payload and shows both paragraphs", () => {
    expect(html).toContain('aria-labelledby="familie-titel"');
    expect(html).toMatch(
      /<h2 id="familie-titel"[^>]*>Familienbetrieb seit 1989</,
    );
    expect(count(html, /<p /g)).toBe(2);
    expect(html).toContain("Georg Tannrieder hat die Werkstatt 1989");
  });

  it("links to the about page and puts the photo after the text", () => {
    expect(html).toMatch(/href="\/ueber-uns"[^>]*>Mehr über uns</);
    expect(html.indexOf("<img")).toBeGreaterThan(html.indexOf("<h2"));
    expect(html).toContain('alt="Foto about-werkstatt"');
  });
});

describe("Testimonials", () => {
  const html = render(<Testimonials testimonials={testimonials} />);

  it("names itself by the h2 from messages", () => {
    expect(html).toContain('aria-labelledby="stimmen-titel"');
    expect(html).toMatch(/<h2 id="stimmen-titel"[^>]*>Was Kunden sagen</);
  });

  it("shows the quotes with German quotation marks and an author each", () => {
    expect(count(html, /<figure /g)).toBe(3);
    expect(count(html, /<blockquote>/g)).toBe(3);
    expect(count(html, /<figcaption /g)).toBe(3);
    expect(html).toContain("„Die Küche passt auf den Zentimeter.“");
    expect(html).toContain("Familie K., Einfamilienhaus");
  });

  it("uses English quotation marks on /en", () => {
    const english = render(<Testimonials testimonials={testimonials} />, "en");

    expect(english).toContain("“Die Küche passt auf den Zentimeter.”");
  });

  it("is left out without testimonials", () => {
    expect(render(<Testimonials testimonials={[]} />)).toBe("");
  });
});

describe("Contact", () => {
  const html = render(
    <Contact
      company={company}
      openingHours={openingHours}
      serviceArea={serviceArea}
    />,
  );

  it("is a white band with a line, named by the h2, with the intro from messages", () => {
    expect(html).toContain('aria-labelledby="kontakt-titel"');
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["bg-weiss", "border-t", "border-linie"]),
    );
    expect(html).toMatch(/<h2 id="kontakt-titel"[^>]*>Sprechen Sie mit uns</);
    expect(html).toContain(de.HomePage.contactIntro);
  });

  it("shows the phone as a tel: link at the top of the scale", () => {
    const phone = html.match(/<a [^>]*href="tel:[^"]*"[^>]*>/)?.[0] ?? "";

    expect(phone).toContain('href="tel:+498999998412"');
    expect(phone).toContain("text-tel-lg");
    expect(html).toContain(">089 99998 412<");
  });

  it("shows the e-mail on the .example domain and the address", () => {
    expect(html).toContain('href="mailto:info@tannrieder.example"');
    expect(html).toContain("Werkstattweg 4");
    expect(html).toContain("85999 Wendelfing");
  });

  it("lists the opening hours from SiteSettings", () => {
    expect(html).toMatch(/<h3 [^>]*>Öffnungszeiten</);
    expect(count(html, /<dt /g)).toBe(2);
    expect(html).toContain(">Mo–Do<");
    expect(html).toContain(">7:00–16:30 Uhr<");
    expect(
      render(<Contact {...{ company, openingHours, serviceArea }} />, "en"),
    ).toContain(">7:00–16:30<");
  });

  it("ends with the area of work and the request button", () => {
    expect(html).toContain("Umkreis von etwa 40 km um Wendelfing");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
  });
});

describe("sceneStep", () => {
  it("splits a caption at the first colon or full stop", () => {
    expect(sceneStep(CAPTIONS[0] ?? "")).toEqual({
      title: "Zuschnitt",
      text: "Jedes Teil wird in unserer Werkstatt millimetergenau zugeschnitten.",
    });
    expect(sceneStep(CAPTIONS[5] ?? "")).toEqual({
      title: "Fertig",
      text: "Vom Aufmaß bis zur Montage in 8–10 Wochen.",
    });
  });

  it("starts the English text with a capital letter", () => {
    expect(
      sceneStep(
        "Cutting: every part is cut to the millimetre in our workshop.",
      ),
    ).toEqual({
      title: "Cutting",
      text: "Every part is cut to the millimetre in our workshop.",
    });
  });

  it("keeps a caption without a short name in front as text", () => {
    expect(sceneStep("  Ohne Namen davor  ")).toEqual({
      title: null,
      text: "Ohne Namen davor",
    });
    expect(sceneStep("Zuschnitt:")).toEqual({
      title: null,
      text: "Zuschnitt:",
    });
    const long = `${"Sehr langer Satz ohne Pause ".repeat(2)}: Text.`;
    expect(sceneStep(long).title).toBeNull();
  });
});

describe("texts and files of the home sections", () => {
  it("has the section texts in both languages", () => {
    for (const messages of [de, en]) {
      expect(messages.HomePage.skipAnimation).toBeTruthy();
      expect(messages.HomePage.sceneImageAlt).toBeTruthy();
      expect(messages.HomePage.servicesTitle).toBeTruthy();
      expect(messages.HomePage.servicesIntro).toBeTruthy();
      expect(messages.HomePage.sceneTitle).toBeTruthy();
      expect(messages.HomePage.sceneIntro).toBeTruthy();
      expect(messages.HomePage.projectsTitle).toBeTruthy();
      expect(messages.HomePage.projectMeta).toContain("{duration}");
      expect(messages.HomePage.processNote).toBeTruthy();
      expect(messages.Process.title).toBeTruthy();
      expect(messages.HomePage.trialDayCta).toBeTruthy();
      expect(messages.HomePage.testimonialsTitle).toBeTruthy();
      expect(messages.HomePage.quote).toContain("{text}");
      expect(messages.HomePage.contactTitle).toBeTruthy();
      expect(messages.HomePage.contactIntro).toBeTruthy();
      expect(messages.HomePage.contactHours).toBeTruthy();
      expect(messages.HomePage.hours).toContain("{hours}");
    }
  });

  it("keeps the finished wardrobe as a small AVIF, about 1600 px high", async () => {
    const path = "public/images/3d/schrank-fertig.avif";
    const file = readFileSync(path);
    const { format, width, height } = await sharp(file).metadata();

    expect(format).toBe("heif");
    expect(file.subarray(4, 12).toString("latin1")).toBe("ftypavif");
    expect(Math.max(width ?? 0, height ?? 0)).toBeGreaterThanOrEqual(1600);
    expect(file.length).toBeLessThan(100 * 1024);
    // The flat drawing it replaced is gone.
    expect(existsSync("public/images/3d/schrank-platzhalter.svg")).toBe(false);
  });

  it("has no photo stand-ins or demo data left", () => {
    expect(existsSync("src/components/ui/PhotoPlaceholder.tsx")).toBe(false);
    expect(existsSync("src/content/demo-home.ts")).toBe(false);
    expect(existsSync("src/content/demo-site.ts")).toBe(false);
    expect(
      readFileSync("src/app/(frontend)/globals.css", "utf8"),
    ).not.toContain("photo-placeholder");
  });
});
