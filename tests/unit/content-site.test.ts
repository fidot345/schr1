import { describe, expect, it, vi } from "vitest";
import {
  getContactDetails,
  getHomePage,
  getLegalTexts,
  getSiteSettings,
} from "@/lib/content";
import { firstParagraphText } from "@/lib/rich-text";

/*
 * The reads for the layout, the contact and legal pages and the home page
 * against SiteSettings and HomePage globals that are plain objects per
 * language, and the summary of a legal text.
 */

const text = (value: string) => ({ type: "text", version: 1, text: value });

const state = (...children: unknown[]) => ({
  root: { type: "root", version: 1, children },
});

const heading = (value: string) => ({
  type: "heading",
  tag: "h2",
  children: [text(value)],
});

const paragraph = (...children: unknown[]) => ({ type: "paragraph", children });

const IMPRINT = {
  de: state(heading("Konzeptprojekt"), paragraph(text("Ein Portfolio."))),
  en: state(heading("Concept project"), paragraph(text("A portfolio."))),
};

const PRIVACY = state(paragraph(), paragraph(text("Keine Cookies.")));

const SETTINGS = {
  de: {
    company: {
      name: "Schreinerei Tannrieder",
      owner: "Johannes Tannrieder",
      logoWord: "Tannrieder",
      street: "Werkstattweg 4",
      postalCode: "85999",
      city: "Wendelfing",
      phone: "089 99998 412",
      email: "info@tannrieder.example",
    },
    tagline: "  Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989. ",
    openingHours: [{ id: "a", days: "Mo–Do", hours: "7:00–16:30" }],
    serviceArea: "Im Umkreis von 40 km.\n\nMit eigenem Team.",
    vacation: { enabled: false },
    imprint: IMPRINT.de,
    privacy: PRIVACY,
  },
};

const media = (id: number, name: string) => ({
  id,
  url: `/api/media/file/${name}.jpg`,
  width: 2400,
  height: 1600,
  alt: `Foto ${name}`,
  focalX: 50,
  focalY: 30,
});

const HOME = {
  hero: {
    title: "Möbel nach Maß",
    text: "Küchen und Türen.",
    image: media(1, "hero-1"),
    facts: [{ id: "f1", highlight: "Meisterbetrieb", text: "seit 1989" }],
  },
  featuredProjects: [
    {
      id: 7,
      title: "Wohnküche in Eiche",
      slug: "wohnkueche-in-eiche",
      objectType: "Einfamilienhaus",
      year: 2025,
      duration: "9 Wochen",
      cover: media(2, "projekt-wohnkueche"),
    },
    // A project that could not be read stays an id and is left out.
    8,
  ],
  processSteps: [{ id: "p1", title: "Aufmaß vor Ort", text: "Wir kommen." }],
  sceneCaptions: [
    { id: "s1", text: "Zuschnitt: Jedes Teil wird zugeschnitten." },
    { id: "s6", text: "Fertig. In 8–10 Wochen." },
  ],
  sceneButton: "Projekt anfragen",
  about: {
    title: "Familienbetrieb seit 1989",
    text: "Erster Absatz.\n\nZweiter Absatz.",
    image: media(3, "about-werkstatt"),
    principles: [
      { id: "g1", title: "Aus einer Werkstatt", text: "Alles bei uns." },
    ],
  },
  careers: {
    title: "Wir suchen Verstärkung",
    text: "Feste Arbeitszeiten.",
    image: null,
    benefits: [{ id: "b1", text: "Freitags ist um 12 Uhr Schluss" }],
    faq: [
      { id: "q1", question: "Brauche ich einen Lebenslauf?", answer: "Nein." },
    ],
  },
  meta: { title: null, description: "Beschreibung." },
};

const calls = vi.hoisted(() => [] as unknown[]);

vi.mock("@/lib/payload", () => ({
  readOptions: (locale: string) => ({
    locale,
    fallbackLocale: "de",
    overrideAccess: false,
  }),
  payloadClient: async () => ({
    findGlobal: async (query: {
      slug: string;
      locale: "de" | "en";
      select: Record<string, true>;
    }) => {
      calls.push(query);
      if (query.slug === "home-page") {
        return HOME;
      }
      const settings =
        query.locale === "en"
          ? {
              ...SETTINGS.de,
              openingHours: [{ id: "a", days: "Mon–Thu", hours: "7:00–16:30" }],
              serviceArea: "Within 40 km.",
              tagline: "",
              imprint: IMPRINT.en,
            }
          : SETTINGS.de;
      // Only what was asked for, as Payload's select does.
      return Object.fromEntries(
        Object.keys(query.select).map((key) => [
          key,
          settings[key as keyof typeof settings],
        ]),
      );
    },
  }),
}));

describe("getContactDetails", () => {
  it("has the company, the hours and where we work, in paragraphs", async () => {
    const contact = await getContactDetails("de");

    expect(contact.company).toMatchObject({
      phone: "089 99998 412",
      email: "info@tannrieder.example",
      street: "Werkstattweg 4",
      postalCode: "85999",
      city: "Wendelfing",
    });
    expect(contact.openingHours).toEqual([
      { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
    ]);
    expect(contact.serviceArea).toEqual([
      "Im Umkreis von 40 km.",
      "Mit eigenem Team.",
    ]);
    expect(calls).toContainEqual(
      expect.objectContaining({
        slug: "site-settings",
        select: { serviceArea: true },
      }),
    );
  });

  it("is in English on /en", async () => {
    const contact = await getContactDetails("en");

    expect(contact.openingHours[0]?.days).toBe("Mon–Thu");
    expect(contact.serviceArea).toEqual(["Within 40 km."]);
  });
});

describe("getSiteSettings", () => {
  it("has the footer line, trimmed", async () => {
    const site = await getSiteSettings("de");

    expect(site.tagline).toBe(
      "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
    );
    expect(site.vacation).toBeNull();
    expect(calls).toContainEqual(
      expect.objectContaining({
        slug: "site-settings",
        select: expect.objectContaining({ tagline: true, company: true }),
      }),
    );
  });

  it("has no footer line when the field is empty", async () => {
    expect((await getSiteSettings("en")).tagline).toBeNull();
  });
});

describe("getHomePage", () => {
  it("has the first screen with its photo and facts", async () => {
    const { hero, meta } = await getHomePage("de");

    expect(hero.title).toBe("Möbel nach Maß");
    expect(hero.photo).toEqual({
      src: "/api/media/file/hero-1.jpg",
      alt: "Foto hero-1",
      width: 2400,
      height: 1600,
      position: "50% 30%",
    });
    expect(hero.facts).toEqual([
      { id: "f1", highlight: "Meisterbetrieb", text: "seit 1989" },
    ]);
    expect(meta).toEqual({ title: null, description: "Beschreibung." });
  });

  it("splits the captions of the scene into name and text", async () => {
    const { sceneSteps } = await getHomePage("de");

    expect(sceneSteps).toEqual([
      { id: "s1", title: "Zuschnitt", text: "Jedes Teil wird zugeschnitten." },
      { id: "s6", title: "Fertig", text: "In 8–10 Wochen." },
    ]);
  });

  it("has the button of the last scene step", async () => {
    const { sceneButton } = await getHomePage("de");

    expect(sceneButton).toBe("Projekt anfragen");
  });

  it("has the readable featured projects with their duration", async () => {
    const { featuredProjects } = await getHomePage("de");

    expect(featuredProjects).toHaveLength(1);
    expect(featuredProjects[0]).toMatchObject({
      slug: "wohnkueche-in-eiche",
      duration: "9 Wochen",
      photo: { alt: "Foto projekt-wohnkueche" },
    });
    expect(calls).toContainEqual(
      expect.objectContaining({
        slug: "home-page",
        populate: {
          projects: expect.objectContaining({ duration: true, cover: true }),
        },
      }),
    );
  });

  it("has the about block with photo and principles", async () => {
    const { about } = await getHomePage("de");

    expect(about.paragraphs).toEqual(["Erster Absatz.", "Zweiter Absatz."]);
    expect(about.photo?.alt).toBe("Foto about-werkstatt");
    expect(about.principles).toEqual([
      { id: "g1", title: "Aus einer Werkstatt", text: "Alles bei uns." },
    ]);
  });

  it("has the careers block with reasons and questions, without a photo", async () => {
    const { careers } = await getHomePage("de");

    expect(careers.photo).toBeNull();
    expect(careers.benefits).toEqual([
      { id: "b1", text: "Freitags ist um 12 Uhr Schluss" },
    ]);
    expect(careers.faq).toEqual([
      { id: "q1", title: "Brauche ich einen Lebenslauf?", text: "Nein." },
    ]);
  });
});

describe("getLegalTexts", () => {
  it("has both texts with the first paragraph as summary", async () => {
    const { imprint, privacy } = await getLegalTexts("de");

    expect(imprint.body).toBe(IMPRINT.de);
    expect(imprint.summary).toBe("Ein Portfolio.");
    expect(privacy.summary).toBe("Keine Cookies.");
    expect(calls).toContainEqual(
      expect.objectContaining({
        select: { imprint: true, privacy: true },
        locale: "de",
      }),
    );
  });

  it("reads the English text on /en", async () => {
    const { imprint } = await getLegalTexts("en");

    expect(imprint.summary).toBe("A portfolio.");
  });
});

describe("firstParagraphText", () => {
  it("skips headings and empty paragraphs", () => {
    expect(
      firstParagraphText(
        state(heading("Titel"), paragraph(), paragraph(text("Zweiter."))),
      ),
    ).toBe("Zweiter.");
  });

  it("joins the text of links and formatting, line breaks as spaces", () => {
    expect(
      firstParagraphText(
        state(
          paragraph(
            text("Bei "),
            { type: "link", children: [text("Vercel")] },
            text(" gehostet."),
            { type: "linebreak" },
            text("  Frankfurt. "),
          ),
        ),
      ),
    ).toBe("Bei Vercel gehostet. Frankfurt.");
  });

  it("is null without a paragraph", () => {
    expect(firstParagraphText(state(heading("Nur Titel")))).toBeNull();
    expect(firstParagraphText(null)).toBeNull();
    expect(firstParagraphText({ root: {} })).toBeNull();
  });
});
