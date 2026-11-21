import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Process } from "@/components/home/Process";
import { RequestCta } from "@/components/sections/RequestCta";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServiceIntro } from "@/components/services/ServiceIntro";
import { ServiceList } from "@/components/services/ServiceList";
import { ServiceOverview } from "@/components/services/ServiceOverview";
import { ServiceProjects } from "@/components/services/ServiceProjects";
import type { ServiceCard } from "@/lib/content";
import type { Photo } from "@/lib/media";
import { render, tagWithId } from "./support/render";

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

const photo = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Foto ${name}`,
  width: 2400,
  height: 1600,
  position: "50% 50%",
});

const services: ServiceCard[] = [
  {
    id: 1,
    title: "Küchen",
    slug: "kuechen",
    summary: "Küchen nach Maß.",
    photo: photo("kueche"),
  },
  {
    id: 2,
    title: "Türen",
    slug: "tueren",
    summary: "Innentüren aus Holz.",
    photo: null,
  },
];

const count = (html: string, pattern: RegExp): number =>
  html.match(pattern)?.length ?? 0;

describe("ServiceList", () => {
  const html = render(<ServiceList services={services} />);

  it("is named by the page's only h1", () => {
    expect(count(html, /<h1[ >]/g)).toBe(1);
    expect(tagWithId(html, "leistungen-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="leistungen-titel"');
    expect(html).toContain(">Leistungen</h1>");
  });

  it("links every card to its service page, with an h2 title", () => {
    expect(html).toContain('href="/leistungen/kuechen"');
    expect(html).toContain('href="/leistungen/tueren"');
    expect(count(html, /<h2[ >]/g)).toBe(2);
    expect(html).toContain("Innentüren aus Holz.");
  });

  it("loads only the first photo eagerly and keeps the frame without a photo", () => {
    expect(count(html, /<img /g)).toBe(1);
    expect(html).toContain('alt="Foto kueche"');
    expect(html).toContain('loading="eager"');
    expect(count(html, /aspect-4\/3/g)).toBe(2);
  });

  it("is in English on /en", () => {
    const english = render(<ServiceList services={services} />, "en");
    expect(english).toContain(">Services</h1>");
  });
});

describe("ServiceIntro", () => {
  const html = render(
    <ServiceIntro
      title="Küchen"
      intro={["Erster Absatz.", "Zweiter Absatz."]}
      photo={photo("kueche")}
    />,
  );

  it("has the h1, every paragraph and the request button", () => {
    expect(tagWithId(html, "leistung-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="leistung-titel"');
    expect(html).toContain("Erster Absatz.");
    expect(html).toContain("Zweiter Absatz.");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
  });

  it("loads the cover first, 4:5 on the phone and 3:2 from md", () => {
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain("aspect-4/5");
    expect(html).toContain("md:aspect-3/2");
  });
});

describe("ServiceOverview", () => {
  const items = [
    { id: "a", text: "Aufmaß vor Ort" },
    { id: "b", text: "Montage" },
  ];

  it("shows what is included, the materials and the duration", () => {
    const html = render(
      <ServiceOverview
        included={items}
        materials={[{ id: "m", text: "Eiche" }]}
        duration="8–10 Wochen"
      />,
    );

    expect(html).toContain('aria-labelledby="ueberblick-titel"');
    expect(tagWithId(html, "ueberblick-titel")).toMatch(/^<h2 /);
    expect(html).toContain("Was dazugehört");
    expect(html).toContain("Aufmaß vor Ort");
    expect(html).toContain("Materialien");
    expect(html).toContain("Eiche");
    expect(html).toContain("Wie lange es dauert");
    expect(html).toContain("8–10 Wochen");
    expect(html).toContain("bg-moos");
  });

  it("leaves out an empty part", () => {
    const html = render(
      <ServiceOverview included={items} materials={[]} duration={null} />,
    );

    expect(html).toContain("Was dazugehört");
    expect(html).not.toContain("Materialien");
    expect(html).not.toContain("Wie lange es dauert");
  });

  it("is not there when everything is empty", () => {
    expect(
      render(<ServiceOverview included={[]} materials={[]} duration={null} />),
    ).toBe("");
  });
});

describe("ServiceGallery", () => {
  it("shows the photos uncropped and lazily", () => {
    const html = render(
      <ServiceGallery photos={[photo("eins"), photo("zwei")]} />,
    );

    expect(html).toContain('aria-labelledby="bilder-titel"');
    expect(count(html, /<img /g)).toBe(2);
    expect(count(html, /loading="lazy"/g)).toBe(2);
    expect(html).toContain('width="2400"');
    expect(html).toContain("h-auto w-full");
  });

  it("is not there without photos", () => {
    expect(render(<ServiceGallery photos={[]} />)).toBe("");
  });
});

describe("ServiceProjects", () => {
  it("links each project and all projects, with the facts line", () => {
    const html = render(
      <ServiceProjects
        projects={[
          {
            id: 7,
            title: "Wohnküche in Eiche",
            slug: "wohnkueche-in-eiche",
            objectType: "Einfamilienhaus",
            year: 2025,
            photo: photo("wohnkueche"),
          },
        ]}
      />,
    );

    expect(html).toContain('aria-labelledby="referenzen-titel"');
    expect(html).toContain('href="/referenzen/wohnkueche-in-eiche"');
    expect(html).toMatch(/href="\/referenzen"[^>]*>Alle Referenzen ansehen</);
    expect(html).toContain("Einfamilienhaus, 2025");
    expect(tagWithId(html, "referenzen-titel")).toMatch(/^<h2 /);
    expect(count(html, /<h3[ >]/g)).toBe(1);
  });

  it("is not there without projects", () => {
    expect(render(<ServiceProjects projects={[]} />)).toBe("");
  });
});

describe("RequestCta", () => {
  it("is a white band with the request button and the optional link", () => {
    const html = render(
      <RequestCta link={{ href: "/leistungen", label: "Alle Leistungen" }} />,
    );

    expect(html).toContain('aria-labelledby="anfrage-titel"');
    expect(html).toContain("border-t border-linie bg-weiss");
    expect(html).toContain("Erzählen Sie uns von Ihrem Projekt");
    expect(html).toMatch(/href="\/anfrage"[^>]*>Projekt anfragen</);
    expect(html).toMatch(/href="\/leistungen"[^>]*>Alle Leistungen</);
  });

  it("has only the button without a link", () => {
    const html = render(<RequestCta />);
    expect(count(html, /<a /g)).toBe(1);
  });
});

describe("Process without a note", () => {
  it("shows the steps and the button but no empty sentence", () => {
    const html = render(
      <Process steps={[{ title: "Aufmaß vor Ort", text: "Wir messen." }]} />,
    );

    expect(html).toContain("Aufmaß vor Ort");
    expect(html).toMatch(/href="\/anfrage"/);
    expect(html).not.toContain("text-lead");
  });
});
