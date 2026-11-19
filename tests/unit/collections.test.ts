import { readFileSync } from "node:fs";
import type {
  Access,
  AccessArgs,
  CollectionConfig,
  Field,
  FieldHook,
  FieldHookArgs,
  ValidateOptions,
} from "payload";
import { describe, expect, it } from "vitest";
import { Jobs } from "../../src/collections/Jobs";
import { Media } from "../../src/collections/Media";
import { Projects } from "../../src/collections/Projects";
import { Services } from "../../src/collections/Services";
import { Team } from "../../src/collections/Team";
import { Testimonials } from "../../src/collections/Testimonials";

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

const fieldsOf = (collection: CollectionConfig) => flatten(collection.fields);

const find = (collection: CollectionConfig, path: string): Field => {
  const match = fieldsOf(collection).find((entry) => entry.path === path);
  if (!match) {
    throw new Error(`${collection.slug}: no field ${path}`);
  }
  return match.field;
};

const prop = (field: Field, key: string): unknown =>
  (field as unknown as Record<string, unknown>)[key];

const accessArgs = (user: unknown): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs;

const check = (access: Access | undefined, user: unknown): unknown => {
  if (!access) {
    throw new Error("access function missing");
  }
  return access(accessArgs(user));
};

const validateOptions = (siblingData: Record<string, unknown>) =>
  ({ siblingData }) as unknown as ValidateOptions<
    unknown,
    unknown,
    never,
    unknown
  >;

const validate = (
  field: Field,
  value: unknown,
  siblingData: Record<string, unknown> = {},
): unknown => {
  const fn = prop(field, "validate");
  if (typeof fn !== "function") {
    throw new Error("validate missing");
  }
  return fn(value, validateOptions(siblingData));
};

const collections = [Services, Projects, Jobs, Team, Testimonials, Media];

const sidebarNames: Record<string, string> = {
  services: "Leistungen",
  projects: "Referenzen",
  jobs: "Karriere",
  team: "Team",
  testimonials: "Kundenstimmen",
  media: "Medien",
};

const requiredFields: Record<string, string[]> = {
  services: [
    "title",
    "slug",
    "summary",
    "intro",
    "included",
    "materials",
    "duration",
    "cover",
    "gallery",
    "order",
    "meta.title",
    "meta.description",
  ],
  projects: [
    "title",
    "slug",
    "service",
    "objectType",
    "year",
    "duration",
    "material",
    "challenge",
    "solution",
    "cover",
    "gallery",
    "order",
    "meta.title",
    "meta.description",
  ],
  jobs: [
    "title",
    "slug",
    "employmentType",
    "start",
    "hours",
    "payMin",
    "payMax",
    "payUnit",
    "payText",
    "intro",
    "tasks",
    "requirements",
    "benefits",
    "datePosted",
    "validThrough",
    "active",
    "order",
    "meta.title",
    "meta.description",
  ],
  team: ["name", "role", "since", "order"],
  testimonials: ["quote", "author", "project", "order"],
  media: ["alt", "credit", "source", "license"],
};

const notTranslated = new Set(["team.name", "media.credit", "media.source"]);

describe.each(collections)("collection $slug", (collection) => {
  it("lets anyone read", () => {
    expect(check(collection.access?.read, null)).toBe(true);
  });

  it("lets only signed-in users create, update and delete", () => {
    for (const operation of ["create", "update", "delete"] as const) {
      const access = collection.access?.[operation];
      expect(check(access, null), operation).toBe(false);
      expect(check(access, { id: 1 }), operation).toBe(true);
    }
  });

  it("sits in the Inhalte group with its German sidebar name", () => {
    expect(collection.admin?.group).toBe("Inhalte");
    expect(collection.labels?.plural).toBe(sidebarNames[collection.slug]);
  });

  it("has every field from the brief", () => {
    const paths = fieldsOf(collection).map((entry) => entry.path);
    for (const path of requiredFields[collection.slug] ?? []) {
      expect(paths, path).toContain(path);
    }
  });

  it("translates every text a visitor sees", () => {
    const untranslated = fieldsOf(collection)
      .filter(({ field }) => ["text", "textarea"].includes(field.type))
      .filter(
        ({ field, inLocalizedParent }) =>
          !inLocalizedParent && prop(field, "localized") !== true,
      )
      .map(({ path }) => `${collection.slug}.${path}`)
      .filter((path) => !notTranslated.has(path));

    expect(untranslated).toEqual([]);
  });
});

describe.each([Services, Projects, Jobs])("slug of $slug", (collection) => {
  const slug = find(collection, "slug");

  it("is required, translated and unique per language", () => {
    expect(prop(slug, "required")).toBe(true);
    expect(prop(slug, "localized")).toBe(true);
    expect(prop(slug, "unique")).toBe(true);
  });

  it("accepts clean slugs and rejects others", () => {
    expect(validate(slug, "kuechen")).toBe(true);
    expect(validate(slug, "Küchen")).not.toBe(true);
    expect(validate(slug, "")).not.toBe(true);
  });

  it("is filled from the title when left empty", () => {
    const hooks = prop(slug, "hooks") as { beforeValidate?: FieldHook[] };
    const hook = hooks.beforeValidate?.[0];
    if (!hook) {
      throw new Error("slug hook missing");
    }
    const run = (value: unknown, title: string) =>
      hook({
        value,
        siblingData: { title },
      } as unknown as FieldHookArgs);

    expect(run(undefined, "Wohnküche in Eiche")).toBe("wohnkueche-in-eiche");
    expect(run("Küchen", "Kitchens")).toBe("kuechen");
  });
});

describe("relations", () => {
  it("links every project to a service", () => {
    const service = find(Projects, "service");
    expect(prop(service, "relationTo")).toBe("services");
    expect(prop(service, "required")).toBe(true);
  });

  it("links a testimonial to a project only when wanted", () => {
    const project = find(Testimonials, "project");
    expect(prop(project, "relationTo")).toBe("projects");
    expect(prop(project, "required")).not.toBe(true);
  });

  it("uses media for covers and galleries", () => {
    for (const collection of [Services, Projects]) {
      expect(prop(find(collection, "cover"), "relationTo")).toBe("media");
      expect(prop(find(collection, "gallery"), "relationTo")).toBe("media");
      expect(prop(find(collection, "gallery"), "hasMany")).toBe(true);
    }
  });
});

describe("media", () => {
  it("requires a translated alt text", () => {
    const alt = find(Media, "alt");
    expect(prop(alt, "required")).toBe(true);
    expect(prop(alt, "localized")).toBe(true);
  });

  it("offers the licenses from the brief", () => {
    const options = prop(find(Media, "license"), "options") as {
      value: string;
    }[];
    expect(options.map((option) => option.value)).toEqual([
      "unsplash",
      "pexels",
      "cc0",
      "own",
    ]);
  });

  it("keeps a focal point and three widths", () => {
    const upload = Media.upload;
    if (typeof upload !== "object") {
      throw new Error("upload config missing");
    }
    expect(upload.focalPoint).toBe(true);
    expect(upload.imageSizes?.map((size) => size.width)).toEqual([
      960, 1600, 2400,
    ]);
  });

  it("accepts only https sources", () => {
    const source = find(Media, "source");
    expect(validate(source, "https://unsplash.com/photos/abc")).toBe(true);
    expect(validate(source, "")).toBe(true);
    expect(validate(source, "http://example.com")).not.toBe(true);
  });
});

describe("jobs", () => {
  it("offers the employment types and pay units from the brief", () => {
    const values = (path: string) =>
      (prop(find(Jobs, path), "options") as { value: string }[]).map(
        (option) => option.value,
      );
    expect(values("employmentType")).toEqual([
      "full_time",
      "part_time",
      "apprenticeship",
    ]);
    expect(values("payUnit")).toEqual(["hour", "month"]);
  });

  it("keeps the upper pay at or above the lower pay", () => {
    const payMax = find(Jobs, "payMax");
    expect(validate(payMax, 23, { payMin: 19 })).toBe(true);
    expect(validate(payMax, 18, { payMin: 19 })).not.toBe(true);
    expect(validate(payMax, undefined, { payMin: 19 })).toBe(true);
  });

  it("asks for a pay unit once a pay range is set", () => {
    const payUnit = find(Jobs, "payUnit");
    expect(validate(payUnit, undefined, { payMin: 19 })).not.toBe(true);
    expect(validate(payUnit, "hour", { payMin: 19 })).toBe(true);
    expect(validate(payUnit, undefined, {})).toBe(true);
  });

  it("does not end a posting before it starts", () => {
    const validThrough = find(Jobs, "validThrough");
    const datePosted = "2026-11-01T00:00:00.000Z";
    expect(
      validate(validThrough, "2026-10-01T00:00:00.000Z", { datePosted }),
    ).not.toBe(true);
    expect(
      validate(validThrough, "2027-01-01T00:00:00.000Z", { datePosted }),
    ).toBe(true);
  });

  it("is open by default", () => {
    expect(prop(find(Jobs, "active"), "defaultValue")).toBe(true);
  });
});

describe("payload config", () => {
  const config = readFileSync("src/payload.config.ts", "utf8");

  it("runs the admin panel in German only", () => {
    expect(config).toMatch(/supportedLanguages:\s*\{\s*de\s*\}/);
    expect(config).toMatch(/fallbackLanguage:\s*"de"/);
  });

  it("stores content in German and English with German fallback", () => {
    expect(config).toMatch(/code:\s*"de"/);
    expect(config).toMatch(/code:\s*"en"/);
    expect(config).toMatch(/defaultLocale:\s*"de"/);
    expect(config).toMatch(/fallback:\s*true/);
  });
});
