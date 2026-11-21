import { existsSync, readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { Jobs } from "@/components/home/Jobs";
import { Process } from "@/components/home/Process";
import { Projects } from "@/components/home/Projects";
import { Services } from "@/components/home/Services";
import { Testimonials } from "@/components/home/Testimonials";
import { WardrobeSection } from "@/components/home/WardrobeSection";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { getDemoHome } from "@/content/demo-home";
import { getDemoSite } from "@/content/demo-site";
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

const home = getDemoHome("de");

describe("PhotoPlaceholder", () => {
  it("is an image with the alt text and shows the caption", () => {
    const html = render(
      <PhotoPlaceholder
        photo={{ tone: "walnut", alt: "Platzhalter", caption: "Foto: Tür" }}
        className="h-52.5"
      />,
    );

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Platzhalter"');
    expect(html).toContain("Foto: Tür");
    expect(classesOf(html)).toEqual(
      expect.arrayContaining([
        "photo-placeholder",
        "photo-placeholder-walnut",
        "h-52.5",
      ]),
    );
  });

  it("uses the base wood tone for oak", () => {
    const html = render(
      <PhotoPlaceholder photo={{ tone: "oak", alt: "a", caption: "b" }} />,
    );

    expect(classesOf(html)).toContain("photo-placeholder");
    expect(html).not.toMatch(/photo-placeholder-/);
  });
});

describe("Hero", () => {
  const html = render(<Hero {...home.hero} />);

  it("names the section by the h1, with the id of the mockup", () => {
    expect(html).toContain('aria-labelledby="hero-titel"');
    expect(html).toMatch(/<h1 id="hero-titel"[^>]*>Möbel nach Maß/);
  });

  it("has the two buttons, request first and jobs second", () => {
    const request = html.indexOf(">Projekt anfragen<");
    const jobs = html.indexOf(">Jobs bei uns<");

    expect(request).toBeGreaterThan(0);
    expect(jobs).toBeGreaterThan(request);
    expect(html).toContain('href="/anfrage"');
    expect(html).toContain('href="/karriere"');
  });

  it("puts the photo first below lg and runs it edge to edge on the phone", () => {
    const photo = html.match(/<div role="img"[^>]*>/)?.[0] ?? "";

    expect(photo).toContain("order-first");
    expect(photo).toContain("-mx-gutter");
    expect(photo).toContain("rounded-none");
    expect(photo).toContain("lg:order-none");
  });

  it("lists the three facts", () => {
    expect(html).toContain("Meisterbetrieb");
    expect(html).toContain("Neun Leute");
    expect(html).toContain("im Umkreis von 40 km");
  });
});

describe("Services", () => {
  const html = render(<Services {...home.services} />);

  it("has the heading from messages and the intro from the data", () => {
    expect(html).toContain('aria-labelledby="leistungen-titel"');
    expect(html).toMatch(/<h2 id="leistungen-titel"[^>]*>Was wir bauen</);
    expect(html).toContain("Alles entsteht in unserer Werkstatt");
  });

  it("shows four cards, each a link with a photo and an h3", () => {
    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html.match(/<h3 /g)).toHaveLength(4);
    expect(html.match(/role="img"/g)).toHaveLength(4);
    expect(html).toContain('href="/leistungen/kuechen"');
  });

  it("speaks English on /en", () => {
    const english = render(<Services {...getDemoHome("en").services} />, "en");

    expect(english).toContain("What we build");
    expect(english).toContain('href="/leistungen/kitchens"');
  });
});

describe("WardrobeSection", () => {
  const html = render(<WardrobeSection {...home.scene} activeStep={3} />);

  it("starts with the link that skips the animation, to the projects", () => {
    expect(html).toContain('href="#projekte"');
    expect(html).toContain("Animation überspringen");
    expect(html.indexOf("Animation überspringen")).toBeLessThan(
      html.indexOf("<h2"),
    );
  });

  it("shows the flat wardrobe with an alt text", () => {
    const image = html.match(/<img[^>]*>/)?.[0] ?? "";

    expect(image).toContain("schrank-platzhalter.svg");
    expect(image).toContain(`alt="${de.HomePage.sceneImageAlt}"`);
  });

  it("lists six steps and marks only the active one", () => {
    expect(html.match(/<li /g)).toHaveLength(6);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="step"[^>]*>.*?Innenleben/);
    expect(html.match(/bg-tannengruen/g)).toHaveLength(1);
  });

  it("moves the mark with activeStep", () => {
    const first = render(<WardrobeSection {...home.scene} activeStep={1} />);

    expect(first).toMatch(/aria-current="step"[^>]*>.*?Zuschnitt/);
  });

  it("names the section by the h2", () => {
    expect(html).toContain('aria-labelledby="szene-titel"');
    expect(tagWithId(html, "szene-titel")).toMatch(/^<h2 /);
  });
});

describe("Projects", () => {
  const html = render(<Projects {...home.projects} />);

  it("is the target of the skip link and names itself by the h2", () => {
    expect(html).toMatch(
      /<section id="projekte" aria-labelledby="projekte-titel"/,
    );
    expect(tagWithId(html, "projekte-titel")).toMatch(/^<h2 /);
  });

  it("links to all projects", () => {
    expect(html).toMatch(/href="\/referenzen"[^>]*>Alle Referenzen ansehen</);
  });

  it("has one large card (h3 step) and two small ones (h4 step)", () => {
    expect(html.match(/<h3 /g)).toHaveLength(3);
    expect(html.match(/class="[^"]*text-h3[^"]*"/g)).toHaveLength(1);
    expect(html.match(/class="[^"]*text-h4[^"]*"/g)).toHaveLength(2);
    expect(html).toContain("Einfamilienhaus, 2025, 9 Wochen");
  });
});

describe("Process", () => {
  const html = render(<Process {...home.process} />);

  it("is a Moos band named by the h2 from messages", () => {
    expect(html).toMatch(/<section aria-labelledby="ablauf-titel"/);
    expect(classesOf(html)).toContain("bg-moos");
    expect(tagWithId(html, "ablauf-titel")).toMatch(/^<h2 /);
    expect(html).toMatch(/<h2 id="ablauf-titel"[^>]*>So läuft Ihr Auftrag</);
  });

  it("lists four steps, each a number, an h3 and a text", () => {
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html.match(/<h3 /g)).toHaveLength(4);
    expect(html.match(/aria-hidden="true"[^>]*>[1-4]</g)).toHaveLength(4);
    expect(html).toContain("Aufmaß vor Ort");
    expect(html).toContain("Montage");
  });

  it("ends with the duration and the request button", () => {
    expect(html).toContain("vergehen meist 8 bis 10 Wochen");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
  });
});

describe("Jobs", () => {
  const html = render(<Jobs {...home.jobs} />);

  it("names itself by the h2 and puts the photo before the text", () => {
    expect(html).toContain('aria-labelledby="jobs-titel"');
    expect(html).toMatch(/<h2 id="jobs-titel"[^>]*>Wir suchen Verstärkung</);
    expect(html.indexOf('role="img"')).toBeLessThan(html.indexOf("<h2"));
  });

  it("lists the three positions as links to their pages", () => {
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain('href="/karriere/schreiner"');
    expect(html).toContain('href="/karriere/monteur"');
    expect(html).toContain('href="/karriere/ausbildung-schreiner"');
    expect(html).toContain("Vollzeit, ab sofort, 19–23 € pro Stunde");
    expect(html.match(/<svg /g)).toHaveLength(3);
  });

  it("has the two buttons, the main one first", () => {
    const all = html.indexOf(">Offene Stellen ansehen<");
    const trial = html.indexOf(">Schnuppertag anfragen<");

    expect(all).toBeGreaterThan(0);
    expect(trial).toBeGreaterThan(all);
  });
});

describe("AboutTeaser", () => {
  const html = render(<AboutTeaser {...home.about} />);

  it("names itself by the h2 and shows both paragraphs", () => {
    expect(html).toContain('aria-labelledby="familie-titel"');
    expect(html).toMatch(
      /<h2 id="familie-titel"[^>]*>Familienbetrieb seit 1989</,
    );
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html).toContain("Georg Tannrieder hat die Werkstatt 1989");
  });

  it("links to the about page and puts the photo after the text", () => {
    expect(html).toMatch(/href="\/ueber-uns"[^>]*>Mehr über uns</);
    expect(html.indexOf('role="img"')).toBeGreaterThan(html.indexOf("<h2"));
  });
});

describe("Testimonials", () => {
  const html = render(<Testimonials {...home.testimonials} />);

  it("names itself by the h2 from messages", () => {
    expect(html).toContain('aria-labelledby="stimmen-titel"');
    expect(html).toMatch(/<h2 id="stimmen-titel"[^>]*>Was Kunden sagen</);
  });

  it("shows three quotes with German quotation marks and an author each", () => {
    expect(html.match(/<figure /g)).toHaveLength(3);
    expect(html.match(/<blockquote>/g)).toHaveLength(3);
    expect(html.match(/<figcaption /g)).toHaveLength(3);
    expect(html).toContain("„Die Küche passt auf den Zentimeter");
    expect(html).toContain("alles sauber.“");
    expect(html).toContain("Familie K., Einfamilienhaus");
  });

  it("uses English quotation marks on /en", () => {
    const english = render(
      <Testimonials {...getDemoHome("en").testimonials} />,
      "en",
    );

    expect(english).toContain("“The kitchen fits to the centimetre");
    expect(english).toContain("everything clean.”");
  });
});

describe("Contact", () => {
  const html = render(
    <Contact {...home.contact} company={getDemoSite("de").company} />,
  );

  it("is a white band with a line, named by the h2", () => {
    expect(html).toContain('aria-labelledby="kontakt-titel"');
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["bg-weiss", "border-t", "border-linie"]),
    );
    expect(html).toMatch(/<h2 id="kontakt-titel"[^>]*>Sprechen Sie mit uns</);
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

  it("lists the opening hours, the weekend in Schiefer", () => {
    expect(html).toMatch(/<h3 [^>]*>Öffnungszeiten</);
    expect(html.match(/<dt /g)).toHaveLength(3);
    expect(html).toContain(">Montag bis Donnerstag<");
    expect(html).toContain(">7:00–16:30 Uhr<");
    expect(html).toMatch(/<dd class="text-schiefer">geschlossen</);
  });

  it("ends with the radius of work and the request button", () => {
    expect(html).toContain("Umkreis von etwa 40 km um Wendelfing");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
  });
});

describe("demo-home", () => {
  it.each(["de", "en"] as const)("has the full set in %s", (locale) => {
    const data = getDemoHome(locale);

    expect(data.services.items).toHaveLength(4);
    expect(data.scene.steps).toHaveLength(6);
    expect(data.projects.more).toHaveLength(2);
    expect(data.hero.facts).toHaveLength(3);
    expect(data.process.steps).toHaveLength(4);
    expect(data.jobs.jobs).toHaveLength(3);
    expect(data.about.paragraphs).toHaveLength(2);
    expect(data.testimonials.items).toHaveLength(3);
    expect(data.contact.hours).toHaveLength(3);
  });

  it("has the same jobs, quotes and hours in both languages", () => {
    const de = getDemoHome("de");
    const en = getDemoHome("en");

    expect(en.jobs.jobs.map((job) => job.id)).toEqual(
      de.jobs.jobs.map((job) => job.id),
    );
    expect(en.testimonials.items.map((item) => item.id)).toEqual(
      de.testimonials.items.map((item) => item.id),
    );
    expect(en.contact.hours.map((row) => row.closed)).toEqual(
      de.contact.hours.map((row) => row.closed),
    );
  });

  it("has the same cards in both languages", () => {
    const ids = (locale: "de" | "en") => {
      const data = getDemoHome(locale);
      return [
        ...data.services.items.map((item) => item.id),
        data.projects.featured.id,
        ...data.projects.more.map((item) => item.id),
      ];
    };

    expect(ids("en")).toEqual(ids("de"));
  });

  it("gives every photo an alt text and a caption", () => {
    for (const locale of ["de", "en"] as const) {
      const data = getDemoHome(locale);
      const photos = [
        data.hero.photo,
        ...data.services.items.map((item) => item.photo),
        data.projects.featured.photo,
        ...data.projects.more.map((item) => item.photo),
        data.jobs.photo,
        data.about.photo,
      ];

      for (const photo of photos) {
        expect(photo.alt.length).toBeGreaterThan(0);
        expect(photo.caption.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("texts and files of the home sections", () => {
  it("has the section texts in both languages", () => {
    for (const messages of [de, en]) {
      expect(messages.HomePage.skipAnimation).toBeTruthy();
      expect(messages.HomePage.sceneImageAlt).toBeTruthy();
      expect(messages.HomePage.servicesTitle).toBeTruthy();
      expect(messages.HomePage.sceneTitle).toBeTruthy();
      expect(messages.HomePage.projectsTitle).toBeTruthy();
      expect(messages.Process.title).toBeTruthy();
      expect(messages.HomePage.jobsTitle).toBeTruthy();
      expect(messages.HomePage.trialDayCta).toBeTruthy();
      expect(messages.HomePage.aboutTitle).toBeTruthy();
      expect(messages.HomePage.testimonialsTitle).toBeTruthy();
      expect(messages.HomePage.quote).toContain("{text}");
      expect(messages.HomePage.contactTitle).toBeTruthy();
      expect(messages.HomePage.contactHours).toBeTruthy();
    }
  });

  it("keeps the flat wardrobe as a file with the viewBox of the mockup", () => {
    const path = "public/images/3d/schrank-platzhalter.svg";

    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toContain('viewBox="-260 -340 520 420"');
  });
});
