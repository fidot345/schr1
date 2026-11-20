import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { HomeAbout } from "@/components/sections/home/HomeAbout";
import { HomeCareers } from "@/components/sections/home/HomeCareers";
import { HomeContact } from "@/components/sections/home/HomeContact";
import { HomeHero } from "@/components/sections/home/HomeHero";
import { HomeProcess } from "@/components/sections/home/HomeProcess";
import { HomeProjects } from "@/components/sections/home/HomeProjects";
import { HomeScene } from "@/components/sections/home/HomeScene";
import { HomeServices } from "@/components/sections/home/HomeServices";
import { HomeTestimonials } from "@/components/sections/home/HomeTestimonials";
import type { SiteContent } from "@/lib/content";
import type { Photo } from "@/lib/media";
import { render, tagWithId } from "./support/render";

/* Same stand-in as in layout-components.test.tsx: Link is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
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
      <a href={path} {...rest}>
        {children}
      </a>
    );
  },
}));

const photo: Photo = {
  src: "/api/media/file/werkstatt.jpg",
  alt: "Blick in die Werkstatt",
  width: 2400,
  height: 1600,
  position: "40% 60%",
};

const imgTags = (html: string): string[] => html.match(/<img [^>]*>/g) ?? [];

describe("HomeHero", () => {
  const html = render(
    <HomeHero
      hero={{
        title: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
        text: "Küchen, Einbauschränke, Türen und Innenausbau.",
        photo,
      }}
    />,
  );

  it("has the page's only h1, labelling the section", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="home-hero-title"');
    expect(tagWithId(html, "home-hero-title")).toMatch(/^<h1 /);
  });

  it("links to the request and to the jobs", () => {
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
    expect(html).toMatch(/<a href="\/karriere"[^>]*>Jobs bei uns<\/a>/);
  });

  it("loads the photo first, with alt text and the focal point", () => {
    const [img] = imgTags(html);
    expect(img).toContain('alt="Blick in die Werkstatt"');
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchPriority="high"');
    expect(img).toContain("object-position:40% 60%");
  });

  it("keeps the frame but shows no image without a photo", () => {
    const empty = render(
      <HomeHero hero={{ title: "Titel", text: "Text", photo: null }} />,
    );
    expect(imgTags(empty)).toEqual([]);
    expect(empty).toContain("aspect-4/5");
  });
});

describe("HomeServices", () => {
  const html = render(
    <HomeServices
      services={[
        {
          id: 1,
          title: "Küchen",
          slug: "kuechen",
          summary: "Ihre Küche nach Maß.",
          photo,
        },
      ]}
    />,
    "en",
  );

  it("makes the whole card one link to the service page", () => {
    expect(html).toMatch(
      /<a href="\/leistungen\/kuechen"[^>]*>[\s\S]*<img [\s\S]*<h3[^>]*>Küchen<\/h3>[\s\S]*Ihre Küche nach Maß\.[\s\S]*<\/a>/,
    );
  });

  it("lazy-loads card photos", () => {
    expect(imgTags(html)[0]).toContain('loading="lazy"');
  });

  it("uses the heading from the messages", () => {
    expect(html).toContain(">What we build</h2>");
  });
});

describe("HomeProjects", () => {
  const html = render(
    <HomeProjects
      projects={[
        {
          id: 1,
          title: "Wohnküche in Eiche",
          slug: "wohnkueche-in-eiche",
          objectType: "Einfamilienhaus",
          year: 2025,
          photo,
        },
      ]}
    />,
  );

  it("writes the year without a thousands separator", () => {
    expect(html).toContain("Einfamilienhaus, 2025");
    expect(html).not.toContain("2.025");
  });

  it("links to the project and to all projects", () => {
    expect(html).toContain('href="/referenzen/wohnkueche-in-eiche"');
    expect(html).toMatch(/href="\/referenzen"[^>]*>Alle Referenzen ansehen/);
  });
});

describe("HomeScene", () => {
  const captions = ["Zuschnitt", "Korpus", "Innenleben"].map((text) => ({
    id: text,
    text,
  }));
  const html = render(<HomeScene captions={captions} />);

  it("lists the captions in order as an ordered list", () => {
    expect(html).toMatch(
      /<ol[^>]*>[\s\S]*Zuschnitt[\s\S]*Korpus[\s\S]*Innenleben[\s\S]*<\/ol>/,
    );
  });

  it("marks the missing wardrobe image as a placeholder", () => {
    expect(html).toContain('data-placeholder="wardrobe-image"');
  });
});

describe("HomeProcess", () => {
  const steps = ["Aufmaß", "Entwurf", "Fertigung", "Montage"].map(
    (title, index) => ({ id: String(index), title, text: `${title} Text` }),
  );
  const html = render(<HomeProcess steps={steps} />);

  it("is an ordered list with the visible number hidden from screen readers", () => {
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html).toMatch(/<ol /);
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>4<\/span>/);
  });
});

describe("HomeCareers", () => {
  const block = {
    title: "Wir suchen Verstärkung",
    paragraphs: ["Eins.", "Zwei."],
  };

  it("lists the open jobs with their type and links to all jobs", () => {
    const html = render(
      <HomeCareers
        block={block}
        jobs={[
          {
            id: 1,
            title: "Schreiner (m/w/d)",
            slug: "schreiner",
            employmentType: "full_time",
          },
        ]}
      />,
    );
    expect(html).toContain('href="/karriere/schreiner"');
    expect(html).toContain("Vollzeit");
    expect(html).toMatch(/href="\/karriere"[^>]*>Offene Stellen ansehen/);
    expect(html.match(/<p /g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("says so when no job is open", () => {
    const html = render(<HomeCareers block={block} jobs={[]} />, "en");
    expect(html).toContain("All positions are filled at the moment.");
    expect(html).not.toContain("<ul");
  });
});

describe("HomeAbout", () => {
  it("shows one <p> per paragraph and links to the about page", () => {
    const html = render(
      <HomeAbout
        block={{ title: "Familienbetrieb seit 1989", paragraphs: ["A.", "B."] }}
      />,
    );
    expect(html).toContain('<p class="max-w-measure text-lead">A.</p>');
    expect(html).toContain('<p class="max-w-measure text-lead">B.</p>');
    expect(html).toMatch(/href="\/ueber-uns"[^>]*>Mehr über uns/);
  });
});

describe("HomeTestimonials", () => {
  it("renders each quote as a figure with blockquote and author", () => {
    const html = render(
      <HomeTestimonials
        testimonials={[
          {
            id: 1,
            quote: "Passt genau.",
            author: "Familie K., Einfamilienhaus",
          },
        ]}
      />,
    );
    expect(html).toMatch(
      /<figure[^>]*><blockquote[^>]*><p>Passt genau\.<\/p><\/blockquote><figcaption[^>]*>Familie K\., Einfamilienhaus<\/figcaption><\/figure>/,
    );
  });
});

describe("HomeContact", () => {
  const site: SiteContent = {
    company: {
      name: "Schreinerei Tannrieder",
      owner: "Johannes Tannrieder",
      street: "Werkstattweg 4",
      postalCode: "85999",
      city: "Wendelfing",
      phone: "089 99998 412",
      email: "info@tannrieder.example",
    },
    openingHours: [{ id: "1", days: "Mo–Do", hours: "7:00–16:30" }],
    vacation: null,
  };
  const html = render(<HomeContact site={site} />);

  it("shows the phone large as a tel: link, email and address", () => {
    expect(html).toMatch(
      /<a href="tel:\+498999998412" class="[^"]*text-h2[^"]*">089 99998 412<\/a>/,
    );
    expect(html).toContain('href="mailto:info@tannrieder.example"');
    expect(html).toMatch(
      /<address[^>]*>[\s\S]*85999 Wendelfing[\s\S]*<\/address>/,
    );
  });

  it("lists the opening hours and the request button", () => {
    expect(html).toMatch(/<dt[^>]*>Mo–Do<\/dt><dd>7:00–16:30<\/dd>/);
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen/);
  });
});
