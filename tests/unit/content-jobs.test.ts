import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJob,
  getOpenJobs,
  getSlugTranslations,
  getTeam,
} from "@/lib/content";

/*
 * The reads of jobs and team against a Payload that is a plain list of
 * documents. `find` applies the `active` filter itself, as Payload does, so
 * the tests show that the reads ask for it.
 */

type Doc = Record<string, unknown>;
type Localized = { de: Doc; en?: Doc };
type Query = {
  collection: string;
  locale: "de" | "en";
  where?: { active?: { equals: boolean } };
};

const row = (id: string, text: string) => ({ id, text });

const JOBS: (Localized & { shared: Doc })[] = [
  {
    shared: {
      id: 1,
      employmentType: "full_time",
      payMin: 19,
      payMax: 23,
      payUnit: "hour",
      active: true,
      datePosted: "2026-11-02T12:00:00.000Z",
      validThrough: "2027-03-31T12:00:00.000Z",
    },
    de: {
      title: "Schreiner (m/w/d)",
      slug: "schreiner",
      start: "ab sofort",
      hours: "Mo–Do",
      intro: "Erster Absatz.\n\nZweiter Absatz.",
      tasks: [row("a", "Küchen fertigen")],
      requirements: [row("b", "Führerschein")],
      benefits: [row("c", "Eigenes Fahrzeug")],
    },
    en: {
      title: "Joiner (m/f/d)",
      slug: "joiner",
      start: "immediately",
      hours: "Mon–Thu",
      intro: "First paragraph.",
      tasks: [row("a", "Making kitchens")],
      requirements: [row("b", "Driving licence")],
      benefits: [row("c", "A company vehicle")],
    },
  },
  {
    // Switched off: no list entry, no page, no slug for the language switch.
    shared: {
      id: 2,
      employmentType: "full_time",
      active: false,
      datePosted: "2026-11-02T12:00:00.000Z",
    },
    de: {
      title: "Monteur (m/w/d)",
      slug: "monteur",
      start: "ab sofort",
      hours: "Mo–Do",
      intro: "Text.",
      tasks: [],
      requirements: [],
      benefits: [],
    },
    en: { title: "Fitter (m/f/d)", slug: "fitter" },
  },
  {
    // No English slug yet: the German one stands in.
    shared: {
      id: 3,
      employmentType: "apprenticeship",
      active: true,
      datePosted: "2026-11-02T12:00:00.000Z",
    },
    de: {
      title: "Praktikum",
      slug: "praktikum",
      start: "September 2027",
      hours: "Mo–Do",
      payText: "900 € im Monat",
      intro: "Text.",
      tasks: [],
      requirements: [],
      benefits: [],
    },
  },
];

const TEAM: (Localized & { shared: Doc })[] = [
  {
    shared: { id: 1, name: "Johannes Tannrieder", since: 2003 },
    de: { role: "Schreinermeister, Inhaber" },
    en: { role: "Master joiner, owner" },
  },
  {
    shared: { id: 2, name: "Anna Huber", since: 2010 },
    de: { role: "Büro" },
  },
];

const localized = (
  docs: (Localized & { shared: Doc })[],
  locale: "de" | "en",
): Doc[] =>
  docs.map(({ shared, de, en }) => ({
    ...shared,
    ...de,
    ...(en && locale === "en" ? en : {}),
  }));

const finds = vi.hoisted(() => ({ calls: [] as unknown[] }));

vi.mock("@/lib/payload", () => ({
  readOptions: (locale: string) => ({
    locale,
    fallbackLocale: "de",
    overrideAccess: false,
  }),
  payloadClient: async () => ({
    find: async (query: Query) => {
      finds.calls.push(query);
      const docs =
        query.collection === "jobs"
          ? localized(JOBS, query.locale)
          : query.collection === "team"
            ? localized(TEAM, query.locale)
            : [];
      return {
        docs: query.where?.active
          ? docs.filter((doc) => doc.active === query.where?.active?.equals)
          : docs,
      };
    },
    findByID: async ({ id, locale }: { id: number; locale: "de" | "en" }) =>
      localized(JOBS, locale).find((doc) => doc.id === id),
  }),
}));

beforeEach(() => {
  finds.calls.length = 0;
});

describe("getOpenJobs", () => {
  it("lists only the jobs that are switched on, in the language", async () => {
    const jobs = await getOpenJobs("de");

    expect(jobs.map((job) => job.slug)).toEqual(["schreiner", "praktikum"]);
    expect(jobs.map((job) => job.id)).toEqual([1, 3]);
    expect((await getOpenJobs("en")).map((job) => job.slug)).toEqual([
      "joiner",
      "praktikum",
    ]);
    expect(finds.calls).toContainEqual(
      expect.objectContaining({
        collection: "jobs",
        where: { active: { equals: true } },
      }),
    );
  });

  it("carries type, start, hours and the pay of each job", async () => {
    const [joiner, training] = await getOpenJobs("en");

    expect(joiner).toMatchObject({
      title: "Joiner (m/f/d)",
      employmentType: "full_time",
      start: "immediately",
      hours: "Mon–Thu",
      pay: { text: null, salary: { min: 19, max: 23, unit: "hour" } },
    });
    expect(training?.pay).toEqual({ text: "900 € im Monat", salary: null });
  });
});

describe("getJob", () => {
  it("is the job with its lists, paragraphs and dates", async () => {
    const job = await getJob("de", "schreiner");

    expect(job).toMatchObject({
      id: 1,
      title: "Schreiner (m/w/d)",
      intro: ["Erster Absatz.", "Zweiter Absatz."],
      tasks: [{ id: "a", text: "Küchen fertigen" }],
      requirements: [{ id: "b", text: "Führerschein" }],
      benefits: [{ id: "c", text: "Eigenes Fahrzeug" }],
      datePosted: "2026-11-02T12:00:00.000Z",
      validThrough: "2027-03-31T12:00:00.000Z",
      meta: { title: null, description: null },
    });
  });

  it("knows the slug of the job in every language", async () => {
    expect((await getJob("en", "joiner"))?.slugs).toEqual({
      de: "schreiner",
      en: "joiner",
    });
    expect((await getJob("de", "praktikum"))?.slugs).toEqual({
      de: "praktikum",
      en: "praktikum",
    });
  });

  it("has no end date when the admin panel has none", async () => {
    expect((await getJob("de", "praktikum"))?.validThrough).toBeNull();
  });

  it("is null for a job that is switched off, an unknown slug and another language's slug", async () => {
    expect(await getJob("de", "monteur")).toBeNull();
    expect(await getJob("en", "fitter")).toBeNull();
    expect(await getJob("de", "gibt-es-nicht")).toBeNull();
    expect(await getJob("en", "schreiner")).toBeNull();
  });
});

describe("getSlugTranslations", () => {
  it("translates the slugs of the open jobs, and only those", async () => {
    const translations = await getSlugTranslations("de");

    expect(translations["/karriere/[slug]"]).toEqual({
      en: { schreiner: "joiner", praktikum: "praktikum" },
    });
    expect((await getSlugTranslations("en"))["/karriere/[slug]"]).toEqual({
      de: { joiner: "schreiner", praktikum: "praktikum" },
    });
  });
});

describe("getTeam", () => {
  it("is name, role in the language and the year, in the admin panel's order", async () => {
    expect(await getTeam("de")).toEqual([
      {
        id: 1,
        name: "Johannes Tannrieder",
        role: "Schreinermeister, Inhaber",
        since: 2003,
      },
      { id: 2, name: "Anna Huber", role: "Büro", since: 2010 },
    ]);
    expect((await getTeam("en"))[0]?.role).toBe("Master joiner, owner");
    expect(finds.calls).toContainEqual(
      expect.objectContaining({ collection: "team", sort: "order" }),
    );
  });
});
