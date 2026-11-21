import { describe, expect, it, vi } from "vitest";
import { getContactDetails, getLegalTexts } from "@/lib/content";
import { firstParagraphText } from "@/lib/rich-text";

/*
 * The reads for the contact and legal pages against a SiteSettings global
 * that is a plain object per language, and the summary of a legal text.
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
    openingHours: [{ id: "a", days: "Mo–Do", hours: "7:00–16:30" }],
    serviceArea: "Im Umkreis von 40 km.\n\nMit eigenem Team.",
    vacation: { enabled: false },
    imprint: IMPRINT.de,
    privacy: PRIVACY,
  },
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
      const settings =
        query.locale === "en"
          ? {
              ...SETTINGS.de,
              openingHours: [{ id: "a", days: "Mon–Thu", hours: "7:00–16:30" }],
              serviceArea: "Within 40 km.",
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
