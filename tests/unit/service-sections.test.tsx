import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "@/components/sections/Card";
import { PageIntro } from "@/components/sections/PageIntro";
import { RequestCta } from "@/components/sections/RequestCta";
import { ServiceDetails } from "@/components/sections/services/ServiceDetails";
import { ServiceGallery } from "@/components/sections/services/ServiceGallery";
import { ServiceHero } from "@/components/sections/services/ServiceHero";
import { ServiceProjects } from "@/components/sections/services/ServiceProjects";
import type { ProjectCard } from "@/lib/content";
import type { Photo } from "@/lib/media";
import { render, tagWithId } from "./support/render";

/* Same stand-in as in home-sections.test.tsx: Link is a plain <a>. */
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
  src: "/api/media/file/kueche.jpg",
  alt: "Küche in Eiche",
  width: 2400,
  height: 1600,
  position: "50% 40%",
};

const imgTags = (html: string): string[] => html.match(/<img [^>]*>/g) ?? [];

const item = (id: string, text: string) => ({ id, text });

describe("Card", () => {
  const props = {
    href: "/leistungen" as const,
    photo,
    title: "Küchen",
    line: "Ihre Küche nach Maß.",
    sizes: "100vw",
  };

  it("has an h3 in h4 size and a lazy photo by default", () => {
    const html = render(<Card {...props} />);
    expect(html).toMatch(/<h3 class="[^"]*text-h4[^"]*">Küchen<\/h3>/);
    expect(imgTags(html)[0]).toContain('loading="lazy"');
  });

  it("takes another heading level and size for a page's main list", () => {
    const html = render(<Card {...props} headingLevel={2} headingSize={3} />);
    expect(html).toMatch(/<h2 class="[^"]*text-h3[^"]*">Küchen<\/h2>/);
  });

  it("loads the photo first when it has priority", () => {
    const [img] = imgTags(render(<Card {...props} priority />));
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchPriority="high"');
  });
});

describe("PageIntro", () => {
  const html = render(
    <PageIntro id="services" title="Leistungen" text="Kurze Einleitung." />,
  );

  it("is a section named by the page's h1", () => {
    expect(html).toContain('aria-labelledby="services-title"');
    expect(tagWithId(html, "services-title")).toMatch(/^<h1 /);
    expect(html).toContain("Kurze Einleitung.");
  });
});

describe("RequestCta", () => {
  it("is a Moos section with the button to the request page", () => {
    const html = render(<RequestCta id="services-request" />);
    expect(html).toMatch(/^<section id="services-request"/);
    expect(html).toContain("bg-moos");
    expect(html).toContain(">Erzählen Sie uns von Ihrem Projekt</h2>");
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
  });

  it("is in English on /en", () => {
    const html = render(<RequestCta id="services-request" />, "en");
    expect(html).toContain(">Tell us about your project</h2>");
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Request a project<\/a>/);
  });
});

describe("ServiceHero", () => {
  const html = render(
    <ServiceHero
      title="Küchen"
      intro={["Erster Absatz.", "Zweiter Absatz."]}
      photo={photo}
    />,
  );

  it("has the page's only h1, labelling the section", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(tagWithId(html, "service-title")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="service-title"');
  });

  it("shows one <p> per paragraph of the introduction", () => {
    expect(html).toMatch(/<p [^>]*>Erster Absatz\.<\/p>/);
    expect(html).toMatch(/<p [^>]*>Zweiter Absatz\.<\/p>/);
  });

  it("links 'Projekt anfragen' to the request page", () => {
    expect(html).toMatch(/<a href="\/anfrage"[^>]*>Projekt anfragen<\/a>/);
  });

  it("loads the cover first, with alt text and the focal point", () => {
    const [img] = imgTags(html);
    expect(img).toContain('alt="Küche in Eiche"');
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchPriority="high"');
    expect(img).toContain("object-position:50% 40%");
  });
});

describe("ServiceDetails", () => {
  const included = [item("a", "Aufmaß vor Ort"), item("b", "Montage")];
  const materials = [item("c", "Eiche"), item("d", "Esche")];

  it("lists what is included and the materials, and says how long it takes", () => {
    const html = render(
      <ServiceDetails
        included={included}
        materials={materials}
        duration="8–10 Wochen"
      />,
    );
    expect(tagWithId(html, "service-included")).toMatch(/^<h2 /);
    expect(html).toContain(">Was dazugehört</h2>");
    expect(html).toContain(">Materialien</h2>");
    expect(html).toContain(">Wie lange es dauert</h2>");
    expect(html.match(/<ul /g)).toHaveLength(2);
    expect(html).toContain("<li>Aufmaß vor Ort</li>");
    expect(html).toContain("<li>Esche</li>");
    expect(html).toContain("8–10 Wochen");
  });

  it("leaves out blocks without content", () => {
    const html = render(
      <ServiceDetails included={included} materials={[]} duration={null} />,
    );
    expect(html).toContain(">Was dazugehört</h2>");
    expect(html).not.toContain("Materialien");
    expect(html).not.toContain("Wie lange");
  });

  it("renders nothing without any content", () => {
    expect(
      render(<ServiceDetails included={[]} materials={[]} duration={null} />),
    ).toBe("");
  });

  it("is in English on /en", () => {
    const html = render(
      <ServiceDetails included={included} materials={materials} duration="x" />,
      "en",
    );
    expect(html).toContain(">What is included</h2>");
    expect(html).toContain(">Materials</h2>");
    expect(html).toContain(">How long it takes</h2>");
  });
});

describe("ServiceGallery", () => {
  const tall: Photo = { ...photo, src: "/api/media/file/b.jpg", height: 3000 };

  it("shows every photo uncropped in its own proportions, lazily", () => {
    const html = render(<ServiceGallery photos={[photo, tall]} />);
    expect(html).toContain(">Bilder</h2>");
    const imgs = imgTags(html);
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toContain('width="2400"');
    expect(imgs[0]).toContain('height="1600"');
    expect(imgs[1]).toContain('height="3000"');
    for (const img of imgs) {
      expect(img).toContain('alt="Küche in Eiche"');
      expect(img).toContain('loading="lazy"');
      expect(img).not.toContain("object-cover");
    }
  });

  it("renders nothing without photos", () => {
    expect(render(<ServiceGallery photos={[]} />)).toBe("");
  });
});

describe("ServiceProjects", () => {
  const projects: ProjectCard[] = [
    {
      id: 1,
      title: "Wohnküche in Eiche",
      slug: "wohnkueche-in-eiche",
      objectType: "Einfamilienhaus",
      year: 2024,
      photo,
    },
  ];

  it("links each project and all projects", () => {
    const html = render(<ServiceProjects projects={projects} />);
    expect(html).toContain(">Referenzen aus diesem Bereich</h2>");
    expect(html).toMatch(
      /<a href="\/referenzen\/wohnkueche-in-eiche"[^>]*>[\s\S]*<h3[^>]*>Wohnküche in Eiche<\/h3>/,
    );
    expect(html).toContain("Einfamilienhaus, 2024");
    expect(html).toMatch(
      /<a href="\/referenzen"[^>]*>Alle Referenzen ansehen<\/a>/,
    );
  });

  it("renders nothing while the service has no projects", () => {
    expect(render(<ServiceProjects projects={[]} />)).toBe("");
  });
});
