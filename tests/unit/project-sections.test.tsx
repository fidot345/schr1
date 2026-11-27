import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectIntro } from "@/components/projects/ProjectIntro";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectNeighbors } from "@/components/projects/ProjectNeighbors";
import { ProjectStory } from "@/components/projects/ProjectStory";
import type { ProjectCard as ProjectCardData } from "@/lib/content";
import type { Photo } from "@/lib/media";
import { PROJECT_FILTER_PARAM, selectedService } from "@/lib/project-filter";
import { render, tagWithId } from "./support/render";

type MockHref =
  | string
  | {
      pathname: string;
      params?: Record<string, string>;
      query?: Record<string, string>;
    };

/* next-intl's Link needs a Next.js request: here it is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: MockHref;
    className?: string;
    children: ReactNode;
    "aria-current"?: "page";
  }) => {
    const path =
      typeof href === "string"
        ? href
        : href.pathname.replace(
            /\[(\w+)\]/g,
            (_, key: string) => href.params?.[key] ?? "",
          );
    const query =
      typeof href === "string" || !href.query
        ? ""
        : `?${new URLSearchParams(href.query)}`;
    return (
      <a
        href={`${path}${query}`}
        className={className}
        aria-current={rest["aria-current"]}
      >
        {children}
      </a>
    );
  },
}));

const photo = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Foto ${name}`,
  width: 2400,
  height: 1600,
  position: "50% 50%",
});

const project = (
  id: number,
  slug: string,
  title: string,
  withPhoto = true,
): ProjectCardData => ({
  id,
  title,
  slug,
  objectType: "Einfamilienhaus",
  year: 2025,
  photo: withPhoto ? photo(slug) : null,
});

const services = [
  { id: 1, title: "Küchen", slug: "kuechen" },
  { id: 2, title: "Türen", slug: "tueren" },
];

const count = (html: string, pattern: RegExp): number =>
  html.match(pattern)?.length ?? 0;

describe("selectedService", () => {
  it("finds the service named in the address, by language", () => {
    expect(selectedService({ leistung: "tueren" }, "de", services)?.id).toBe(2);
    expect(selectedService({ service: "kuechen" }, "en", services)?.slug).toBe(
      "kuechen",
    );
    expect(PROJECT_FILTER_PARAM).toEqual({ de: "leistung", en: "service" });
  });

  it("treats an unknown, empty, repeated or foreign parameter as no filter", () => {
    expect(selectedService({ leistung: "gibt-es-nicht" }, "de", services)).toBe(
      null,
    );
    expect(selectedService({ leistung: "" }, "de", services)).toBe(null);
    expect(
      selectedService({ leistung: ["kuechen", "tueren"] }, "de", services),
    ).toBe(null);
    expect(selectedService({ service: "kuechen" }, "de", services)).toBe(null);
    expect(selectedService({}, "de", services)).toBe(null);
  });
});

describe("ProjectCard", () => {
  it("links the whole card to the project, with the facts line", () => {
    const html = render(
      <ProjectCard
        project={project(7, "wohnkueche-in-eiche", "Wohnküche in Eiche")}
        headingLevel="h2"
        sizes="100vw"
      />,
    );

    expect(html).toMatch(/^<a href="\/referenzen\/wohnkueche-in-eiche"/);
    expect(html).toMatch(/<h2 [^>]*>Wohnküche in Eiche<\/h2>/);
    expect(html).toContain("Einfamilienhaus, 2025");
    expect(html).toContain("aspect-4/3");
    expect(html).toContain('loading="lazy"');
  });
});

describe("ProjectList", () => {
  const projects = [
    project(1, "wohnkueche-in-eiche", "Wohnküche in Eiche"),
    project(2, "innentueren", "Innentüren", false),
  ];

  it("is named by the page's only h1, with an h2 per card", () => {
    const html = render(
      <ProjectList
        projects={projects}
        services={services}
        selected={null}
        filterParam="leistung"
      />,
    );

    expect(count(html, /<h1[ >]/g)).toBe(1);
    expect(tagWithId(html, "referenzen-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="referenzen-titel"');
    expect(html).toContain(">Referenzen</h1>");
    expect(count(html, /<h2[ >]/g)).toBe(2);
    expect(html).toContain('href="/referenzen/wohnkueche-in-eiche"');
    expect(count(html, /loading="eager"/g)).toBe(1);
  });

  it("has a named filter of links with the service in the address", () => {
    const html = render(
      <ProjectList
        projects={projects}
        services={services}
        selected={null}
        filterParam="leistung"
      />,
    );

    expect(html).toContain(
      '<nav aria-label="Referenzen nach Leistung filtern"',
    );
    expect(html).toMatch(
      /href="\/referenzen"[^>]*aria-current="page"[^>]*>Alle</,
    );
    expect(html).toMatch(/href="\/referenzen\?leistung=kuechen"[^>]*>Küchen</);
    expect(html).toMatch(/href="\/referenzen\?leistung=tueren"[^>]*>Türen</);
    expect(count(html, /aria-current="page"/g)).toBe(1);
  });

  it("marks the chosen service as current and fills its button", () => {
    const html = render(
      <ProjectList
        projects={projects.slice(0, 1)}
        services={services}
        selected="kuechen"
        filterParam="leistung"
      />,
    );

    const current = html.match(/<a [^>]*aria-current="page"[^>]*>[^<]*</)?.[0];
    expect(current).toContain("?leistung=kuechen");
    expect(current).toContain("bg-tannengruen");
    expect(html).toMatch(/href="\/referenzen" class="[^"]*border-tannengruen/);
    expect(count(html, /<h2[ >]/g)).toBe(1);
  });

  it("says so when the service has no projects", () => {
    const html = render(
      <ProjectList
        projects={[]}
        services={services}
        selected="tueren"
        filterParam="leistung"
      />,
    );

    expect(html).toContain(
      "Aus diesem Bereich zeigen wir noch keine Referenzen.",
    );
    expect(html).not.toContain("<h2");
  });

  it("is in English on /en", () => {
    const html = render(
      <ProjectList
        projects={projects}
        services={services}
        selected={null}
        filterParam="service"
      />,
      "en",
    );

    expect(html).toContain(">Projects</h1>");
    expect(html).toMatch(/aria-current="page"[^>]*>All</);
    expect(html).toContain('href="/referenzen?service=kuechen"');
  });
});

describe("ProjectIntro", () => {
  const facts = {
    objectType: "Einfamilienhaus",
    year: 2025,
    duration: "9 Wochen",
    material: "Eiche, geölt",
  };

  it("has the h1, the four facts, the service link and the cover first", () => {
    const html = render(
      <ProjectIntro
        title="Wohnküche in Eiche"
        facts={facts}
        service={{ title: "Küchen", slug: "kuechen" }}
        photo={photo("wohnkueche")}
      />,
    );

    expect(tagWithId(html, "referenz-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="referenz-titel"');
    for (const [label, value] of [
      ["Objekt", "Einfamilienhaus"],
      ["Jahr", "2025"],
      ["Dauer", "9 Wochen"],
      ["Material", "Eiche, geölt"],
    ]) {
      expect(html).toMatch(
        new RegExp(`<dt [^>]*>${label}</dt><dd [^>]*>${value}</dd>`),
      );
    }
    expect(html).toMatch(/<dt [^>]*>Leistung<\/dt>/);
    expect(html).toMatch(/href="\/leistungen\/kuechen"[^>]*>Küchen</);
    expect(html).toContain('loading="eager"');
    expect(html).toContain("aspect-4/5");
    expect(html).toContain("md:aspect-3/2");
  });

  it("leaves out the service row when the service is unknown", () => {
    const html = render(
      <ProjectIntro
        title="Wohnküche in Eiche"
        facts={facts}
        service={null}
        photo={null}
      />,
    );

    expect(html).not.toContain("Leistung");
    expect(html).not.toContain("<img");
  });
});

describe("ProjectStory", () => {
  it("is two sections, each named by its h2", () => {
    const html = render(
      <ProjectStory
        challenge={["Viel Stauraum.", "Keine Oberschränke."]}
        solution={["Eine Schrankwand bis unter die Decke."]}
      />,
    );

    expect(html).toContain('aria-labelledby="aufgabe-titel"');
    expect(html).toContain('aria-labelledby="loesung-titel"');
    expect(tagWithId(html, "aufgabe-titel")).toMatch(/^<h2 /);
    expect(html).toContain(">Die Aufgabe</h2>");
    expect(html).toContain(">Unsere Lösung</h2>");
    expect(html).toContain("Keine Oberschränke.");
    expect(html).toContain("md:grid-cols-2");
  });

  it("leaves out an empty part, and everything when both are empty", () => {
    const html = render(<ProjectStory challenge={["Text."]} solution={[]} />);
    expect(html).not.toContain("Unsere Lösung");
    expect(render(<ProjectStory challenge={[]} solution={[]} />)).toBe("");
  });
});

describe("ProjectNeighbors", () => {
  const previous = project(1, "garderobe", "Garderobe mit Sitzbank");
  const next = project(3, "buecherwand", "Bücherwand im Wohnzimmer");

  it("links the previous and the next project", () => {
    const html = render(<ProjectNeighbors previous={previous} next={next} />);

    expect(html).toContain('aria-labelledby="weitere-titel"');
    expect(tagWithId(html, "weitere-titel")).toMatch(/^<h2 /);
    expect(html).toMatch(
      /href="\/referenzen\/garderobe"[\s\S]*Vorherige Referenz[\s\S]*Garderobe mit Sitzbank/,
    );
    expect(html).toMatch(
      /href="\/referenzen\/buecherwand"[\s\S]*Nächste Referenz[\s\S]*Bücherwand im Wohnzimmer/,
    );
    expect(count(html, /<h3[ >]/g)).toBe(2);
  });

  it("puts a pair side by side, two of four columns each", () => {
    const html = render(<ProjectNeighbors previous={previous} next={next} />);
    expect(html).toContain("md:grid-cols-4");
    expect(count(html, /<li class="md:col-span-2">/g)).toBe(2);
    expect(html).not.toContain("md:col-start-2");
  });

  it("centres the only neighbour of the first and of the last project", () => {
    for (const html of [
      render(<ProjectNeighbors previous={null} next={next} />),
      render(<ProjectNeighbors previous={previous} next={null} />),
    ]) {
      expect(count(html, /<li /g)).toBe(1);
      expect(html).toContain('<li class="md:col-span-2 md:col-start-2">');
    }
    expect(
      render(<ProjectNeighbors previous={null} next={next} />),
    ).not.toContain("Vorherige Referenz");
    expect(
      render(<ProjectNeighbors previous={previous} next={null} />),
    ).not.toContain("Nächste Referenz");
  });

  it("is not there for the only project", () => {
    expect(render(<ProjectNeighbors previous={null} next={null} />)).toBe("");
  });
});
