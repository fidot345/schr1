import type {
  Access,
  AccessArgs,
  Field,
  GlobalConfig,
  ValidateOptions,
} from "payload";
import { describe, expect, it } from "vitest";
import { HomePage } from "../../src/globals/HomePage";
import {
  LEGAL_TEXT_FEATURES,
  SiteSettings,
} from "../../src/globals/SiteSettings";
import { countRows } from "../../src/globals/validators";

type FlatField = { path: string; field: Field; inLocalizedParent: boolean };

const flatten = (
  fields: Field[],
  prefix = "",
  inLocalizedParent = false,
): FlatField[] =>
  fields.flatMap((field): FlatField[] => {
    if (field.type === "row" || field.type === "collapsible") {
      return flatten(field.fields, prefix, inLocalizedParent);
    }
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) =>
        flatten(tab.fields, prefix, inLocalizedParent),
      );
    }
    if (!("name" in field)) {
      return [];
    }
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    const self: FlatField = { path, field, inLocalizedParent };
    if (field.type === "group" || field.type === "array") {
      const localized = inLocalizedParent || field.localized === true;
      return [self, ...flatten(field.fields, path, localized)];
    }
    return [self];
  });

const fieldsOf = (global: GlobalConfig) => flatten(global.fields);

const find = (global: GlobalConfig, path: string): Field => {
  const match = fieldsOf(global).find((entry) => entry.path === path);
  if (!match) {
    throw new Error(`${global.slug}: no field ${path}`);
  }
  return match.field;
};

const prop = (field: Field, key: string): unknown =>
  (field as unknown as Record<string, unknown>)[key];

const check = (access: Access | undefined, user: unknown): unknown => {
  if (!access) {
    throw new Error("access function missing");
  }
  return access({ req: { user } } as unknown as AccessArgs);
};

const t = (key: string) => key;
const fakeReq = {
  t,
  payload: {
    collections: { projects: {} },
    db: { defaultIDType: "number" },
  },
};

/** Runs a field's validate with the options Payload would pass. */
const validate = (
  field: Field,
  value: unknown,
  siblingData: Record<string, unknown> = {},
): unknown => {
  const fn = prop(field, "validate");
  if (typeof fn !== "function") {
    throw new Error("validate missing");
  }
  const options = {
    ...(field as unknown as Record<string, unknown>),
    event: "onChange",
    req: fakeReq,
    siblingData,
  } as unknown as ValidateOptions<unknown, unknown, never, unknown>;
  return fn(value, options);
};

const globals = [SiteSettings, HomePage];

const requiredFields: Record<string, string[]> = {
  "site-settings": [
    "company.name",
    "company.owner",
    "company.logoWord",
    "company.street",
    "company.postalCode",
    "company.city",
    "company.phone",
    "company.email",
    "tagline",
    "openingHours",
    "openingHours.days",
    "openingHours.hours",
    "serviceArea",
    "vacation.enabled",
    "vacation.from",
    "vacation.until",
    "imprint",
    "privacy",
  ],
  "home-page": [
    "hero.title",
    "hero.text",
    "hero.image",
    "hero.facts.highlight",
    "hero.facts.text",
    "featuredProjects",
    "processSteps.title",
    "processSteps.text",
    "sceneCaptions.text",
    "about.title",
    "about.text",
    "about.image",
    "about.principles.title",
    "about.principles.text",
    "careers.title",
    "careers.text",
    "careers.image",
    "careers.benefits.text",
    "careers.faq.question",
    "careers.faq.answer",
    "meta.title",
    "meta.description",
  ],
};

/** Company data and opening times stay the same in both languages. */
const notTranslated = new Set([
  "site-settings.openingHours.hours",
  "site-settings.company.name",
  "site-settings.company.owner",
  "site-settings.company.logoWord",
  "site-settings.company.street",
  "site-settings.company.postalCode",
  "site-settings.company.city",
  "site-settings.company.phone",
]);

describe.each(globals)("global $slug", (global) => {
  it("lets anyone read", () => {
    expect(check(global.access?.read, null)).toBe(true);
  });

  it("lets only signed-in users update", () => {
    expect(check(global.access?.update, null)).toBe(false);
    expect(check(global.access?.update, { id: 1 })).toBe(true);
  });

  it("sits in the Einstellungen group", () => {
    expect(global.admin?.group).toBe("Einstellungen");
  });

  it("has every field from the brief", () => {
    const paths = fieldsOf(global).map((entry) => entry.path);
    for (const path of requiredFields[global.slug] ?? []) {
      expect(paths, path).toContain(path);
    }
  });

  it("translates every text a visitor sees", () => {
    const untranslated = fieldsOf(global)
      .filter(({ field }) =>
        ["text", "textarea", "richText"].includes(field.type),
      )
      .filter(
        ({ field, inLocalizedParent }) =>
          !inLocalizedParent && prop(field, "localized") !== true,
      )
      .map(({ path }) => `${global.slug}.${path}`)
      .filter((path) => !notTranslated.has(path));

    expect(untranslated).toEqual([]);
  });
});

describe("site settings", () => {
  it("labels the globals in German", () => {
    expect(SiteSettings.label).toBe("Website-Einstellungen");
    expect(HomePage.label).toBe("Startseite");
  });

  it("keeps imprint and privacy as translated rich text", () => {
    for (const path of ["imprint", "privacy"]) {
      const field = find(SiteSettings, path);
      expect(field.type, path).toBe("richText");
      expect(prop(field, "localized"), path).toBe(true);
      expect(prop(field, "editor"), path).toBeDefined();
    }
  });

  it("limits the legal texts to headings, paragraphs, lists and web links", () => {
    expect(LEGAL_TEXT_FEATURES.map((feature) => feature.key).sort()).toEqual(
      [
        "heading",
        "link",
        "orderedList",
        "paragraph",
        "toolbarFixed",
        "toolbarInline",
        "unorderedList",
      ].sort(),
    );
    const props = (key: string) =>
      LEGAL_TEXT_FEATURES.find((feature) => feature.key === key)
        ?.serverFeatureProps;
    // The page has the h1; the text starts at h2.
    expect(props("heading")).toEqual({ enabledHeadingSizes: ["h2", "h3"] });
    // No links to documents of the admin panel: they have no address.
    expect(props("link")).toEqual({ enabledCollections: [] });
  });

  it("has a translated, optional line for the footer", () => {
    const tagline = find(SiteSettings, "tagline");
    expect(tagline.type).toBe("text");
    expect(prop(tagline, "localized")).toBe(true);
    // A NOT NULL column could not be added to the saved settings rows.
    expect(prop(tagline, "required")).not.toBe(true);
    expect(prop(tagline, "maxLength")).toBe(120);
  });

  it("has no field for the vacation banner text", () => {
    const vacation = fieldsOf(SiteSettings)
      .map((entry) => entry.path)
      .filter((path) => path.startsWith("vacation."));
    expect(vacation).toEqual([
      "vacation.enabled",
      "vacation.from",
      "vacation.until",
    ]);
  });

  it("translates the days but keeps one set of opening times", () => {
    expect(prop(find(SiteSettings, "openingHours.days"), "localized")).toBe(
      true,
    );
    expect(
      prop(find(SiteSettings, "openingHours.hours"), "localized"),
    ).not.toBe(true);
  });

  it("keeps the vacation off by default", () => {
    expect(prop(find(SiteSettings, "vacation.enabled"), "defaultValue")).toBe(
      false,
    );
  });

  it("needs both dates while the vacation is on", () => {
    const from = find(SiteSettings, "vacation.from");
    const until = find(SiteSettings, "vacation.until");
    expect(validate(from, undefined, { enabled: true })).not.toBe(true);
    expect(validate(until, undefined, { enabled: true })).not.toBe(true);
    expect(validate(from, undefined, { enabled: false })).toBe(true);
    expect(validate(until, undefined, {})).toBe(true);
  });

  it("does not end the vacation before it starts", () => {
    const until = find(SiteSettings, "vacation.until");
    const from = "2026-12-24T11:00:00.000Z";
    expect(
      validate(until, "2026-12-20T11:00:00.000Z", { enabled: true, from }),
    ).not.toBe(true);
    expect(validate(until, from, { enabled: true, from })).toBe(true);
    expect(
      validate(until, "2027-01-06T11:00:00.000Z", { enabled: true, from }),
    ).toBe(true);
  });

  it("accepts only five-digit postal codes", () => {
    const postalCode = find(SiteSettings, "company.postalCode");
    expect(validate(postalCode, "85999")).toBe(true);
    expect(validate(postalCode, "8599")).not.toBe(true);
    expect(validate(postalCode, "D-85999")).not.toBe(true);
  });

  it("needs a logo word, but keeps its column nullable", () => {
    const logoWord = find(SiteSettings, "company.logoWord");
    expect(logoWord.type).toBe("text");
    expect(prop(logoWord, "localized")).not.toBe(true);
    // A NOT NULL column could not be added to the saved settings row.
    expect(prop(logoWord, "required")).not.toBe(true);
    expect(validate(logoWord, "Tannrieder")).toBe(true);
    expect(validate(logoWord, "")).not.toBe(true);
    expect(validate(logoWord, "   ")).not.toBe(true);
    expect(validate(logoWord, undefined)).not.toBe(true);
    expect(validate(logoWord, null)).not.toBe(true);
  });

  it("keeps the logo word short enough for the header", () => {
    const logoWord = find(SiteSettings, "company.logoWord");
    expect(prop(logoWord, "maxLength")).toBe(30);
    expect(validate(logoWord, "T".repeat(30))).toBe(true);
    expect(validate(logoWord, "T".repeat(31))).not.toBe(true);
  });

  it("stores the e-mail as an e-mail field", () => {
    expect(find(SiteSettings, "company.email").type).toBe("email");
  });
});

describe("home page", () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ id: String(index) }));

  it("uses a photo from the media library for the first screen", () => {
    const image = find(HomePage, "hero.image");
    expect(prop(image, "relationTo")).toBe("media");
    expect(prop(image, "required")).toBe(true);
  });

  it("features exactly three different projects", async () => {
    const featured = find(HomePage, "featuredProjects");
    expect(prop(featured, "relationTo")).toBe("projects");
    expect(prop(featured, "hasMany")).toBe(true);
    expect(prop(featured, "minRows")).toBe(3);
    expect(prop(featured, "maxRows")).toBe(3);
    expect(await validate(featured, [1, 2, 3])).toBe(true);
    expect(await validate(featured, [1, 2])).not.toBe(true);
    expect(await validate(featured, [1, 2, 3, 4])).not.toBe(true);
    expect(await validate(featured, [1, 1, 2])).not.toBe(true);
    expect(await validate(featured, undefined)).not.toBe(true);
  });

  it.each([
    ["processSteps", 4],
    ["sceneCaptions", 6],
  ])("keeps exactly the right number of %s", (path, count) => {
    const field = find(HomePage, path);
    expect(prop(field, "minRows")).toBe(count);
    expect(prop(field, "maxRows")).toBe(count);
    expect(validate(field, rows(count))).toBe(true);
    expect(validate(field, count)).toBe(true);
    expect(validate(field, rows(count - 1))).not.toBe(true);
    expect(validate(field, rows(count + 1))).not.toBe(true);
    expect(validate(field, undefined)).not.toBe(true);
  });

  it.each([
    ["hero.facts", 3],
    ["about.principles", 3],
    ["careers.benefits", 4],
    ["careers.faq", 4],
  ])("keeps %s optional, with at most %i rows", (path, max) => {
    const field = find(HomePage, path);
    expect(field.type).toBe("array");
    expect(prop(field, "maxRows")).toBe(max);
    expect(prop(field, "minRows")).toBeUndefined();
    expect(prop(field, "required")).not.toBe(true);
  });

  it.each(["about.image", "careers.image"])(
    "has an optional photo from the media library at %s",
    (path) => {
      const image = find(HomePage, path);
      expect(image.type).toBe("upload");
      expect(prop(image, "relationTo")).toBe("media");
      // A NOT NULL column could not be added to the saved home page row.
      expect(prop(image, "required")).not.toBe(true);
    },
  );

  it("counts rows the way the admin form and the server pass them", () => {
    expect(countRows([{}, {}])).toBe(2);
    expect(countRows(3)).toBe(3);
    expect(countRows(undefined)).toBe(0);
  });
});
