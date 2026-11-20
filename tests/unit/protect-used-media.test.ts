import { APIError, type Field, type PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findMediaFields, findMediaUsage, protectUsedMedia } = await import(
  "../../src/hooks/protect-used-media"
);
const { Jobs } = await import("../../src/collections/Jobs");
const { Media } = await import("../../src/collections/Media");
const { Projects } = await import("../../src/collections/Projects");
const { Services } = await import("../../src/collections/Services");
const { Team } = await import("../../src/collections/Team");
const { Testimonials } = await import("../../src/collections/Testimonials");
const { HomePage } = await import("../../src/globals/HomePage");
const { SiteSettings } = await import("../../src/globals/SiteSettings");

type Doc = Record<string, unknown> & { id: number };

/** A fake Payload: `find` answers from `docs` by the queried path. */
const makeReq = ({
  docs = {},
  globals = {},
  extraFields = [],
}: {
  docs?: Record<string, Doc[]>;
  globals?: Record<string, unknown>;
  extraFields?: Field[];
}) => {
  const find = vi.fn(
    async ({
      collection,
      where,
    }: {
      collection: string;
      where: Record<string, { in: number[] }>;
      locale?: string;
    }) => {
      const [path, condition] = Object.entries(where)[0] ?? [];
      const id = condition?.in[0];
      const matches = (docs[collection] ?? []).filter((doc) => {
        const value = path
          ?.split(".")
          .reduce<unknown>(
            (data, key) =>
              typeof data === "object" && data !== null
                ? (data as Record<string, unknown>)[key]
                : undefined,
            doc,
          );
        return Array.isArray(value) ? value.includes(id) : value === id;
      });
      return { docs: matches };
    },
  );
  const findGlobal = vi.fn(
    async ({ slug }: { slug: string }) => globals[slug] ?? {},
  );
  const findByID = vi.fn(async () => ({ id: 7, filename: "hero-1.jpg" }));
  const collection = (config: {
    slug: string;
    labels?: unknown;
    admin?: { useAsTitle?: string };
    fields: Field[];
  }) => ({
    ...config,
    labels: config.labels ?? { singular: config.slug },
    admin: config.admin ?? {},
  });
  const req = {
    payload: {
      config: {
        collections: [
          collection(Services),
          collection(Projects),
          collection(Jobs),
          collection(Team),
          collection(Testimonials),
          collection(Media),
          collection({
            slug: "payload-locked-documents",
            fields: [
              {
                name: "document",
                type: "relationship",
                relationTo: ["media", "services"],
              },
            ],
          }),
          ...(extraFields.length
            ? [collection({ slug: "extra", fields: extraFields })]
            : []),
        ],
        globals: [HomePage, SiteSettings],
        localization: { localeCodes: ["de", "en"] },
      },
      find,
      findGlobal,
      findByID,
    },
  } as unknown as PayloadRequest;
  return { req, find, findGlobal };
};

describe("findMediaFields", () => {
  it("finds cover and gallery of services and projects", () => {
    for (const config of [Services, Projects]) {
      expect(findMediaFields(config.fields)).toEqual([
        { path: "cover", label: "Titelbild", localized: false },
        { path: "gallery", label: "Galerie", localized: false },
      ]);
    }
  });

  it("finds the hero photo of the home page with its group label", () => {
    expect(findMediaFields(HomePage.fields)).toEqual([
      {
        path: "hero.image",
        label: "Erster Bildschirm › Foto",
        localized: false,
      },
    ]);
  });

  it("finds nothing where no photo is used", () => {
    for (const config of [Jobs, Team, Testimonials, Media, SiteSettings]) {
      expect(findMediaFields(config.fields)).toEqual([]);
    }
  });

  it("follows arrays, named tabs and localized parents", () => {
    const fields: Field[] = [
      {
        type: "tabs",
        tabs: [
          {
            name: "content",
            label: "Inhalt",
            localized: true,
            fields: [
              {
                name: "slides",
                type: "array",
                label: "Bilder",
                fields: [
                  {
                    name: "image",
                    type: "upload",
                    label: "Bild",
                    relationTo: "media",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(findMediaFields(fields)).toEqual([
      {
        path: "content.slides.image",
        label: "Inhalt › Bilder › Bild",
        localized: true,
      },
    ]);
  });
});

describe("protectUsedMedia", () => {
  it("is the beforeDelete hook of the media collection", () => {
    expect(Media.hooks?.beforeDelete).toContain(protectUsedMedia);
  });

  it("lets an unused photo go", async () => {
    const { req } = makeReq({});
    await expect(
      protectUsedMedia({
        id: 7,
        req,
        collection: Media,
        context: {},
      } as unknown as Parameters<typeof protectUsedMedia>[0]),
    ).resolves.toBeUndefined();
  });

  it("explains in German where the photo is still used", async () => {
    const { req } = makeReq({
      docs: {
        services: [{ id: 1, title: "Küchen", cover: 7, gallery: [] }],
        projects: [
          { id: 2, title: "Wohnküche in Eiche", cover: 3, gallery: [7] },
        ],
      },
      globals: { "home-page": { hero: { image: 7 } } },
    });
    const error = await protectUsedMedia({
      id: 7,
      req,
      collection: Media,
      context: {},
    } as unknown as Parameters<typeof protectUsedMedia>[0]).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(APIError);
    expect((error as APIError).status).toBe(409);
    expect((error as APIError).message).toBe(
      "„hero-1.jpg“ kann nicht gelöscht werden, weil es noch verwendet wird: Leistung „Küchen“ (Titelbild); Referenz „Wohnküche in Eiche“ (Galerie); Startseite (Erster Bildschirm › Foto). Bitte das Bild dort zuerst ersetzen oder entfernen.",
    );
  });

  it("matches the global photo also when it is loaded as an object", async () => {
    const { req } = makeReq({
      globals: { "home-page": { hero: { image: { id: 7 } } } },
    });
    await expect(findMediaUsage(req, 7)).resolves.toEqual([
      "Startseite (Erster Bildschirm › Foto)",
    ]);
  });

  it("ignores Payload's own collections such as document locks", async () => {
    const { req, find } = makeReq({
      docs: { "payload-locked-documents": [{ id: 1, document: 7 }] },
    });
    await expect(findMediaUsage(req, 7)).resolves.toEqual([]);
    const queried = find.mock.calls.map(([options]) => options.collection);
    expect(queried).not.toContain("payload-locked-documents");
  });

  it("checks every language for a localized photo field", async () => {
    const { req, find } = makeReq({
      extraFields: [
        { name: "image", type: "upload", relationTo: "media", localized: true },
      ],
    });
    await findMediaUsage(req, 7);
    const locales = find.mock.calls
      .filter(([options]) => options.collection === "extra")
      .map(([options]) => options.locale);
    expect(locales).toEqual(["de", "en"]);
  });
});
