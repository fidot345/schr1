/*
 * npm run seed: fills the database with the demo content (BRIEF.md
 * section 2) in German and English, with photos from seed/images/.
 *
 * Safe to run again: every document is found by a stable key and updated
 * instead of created twice. An existing photo keeps its stored file: a run
 * does not upload it again.
 *
 * With NODE_ENV=production the seed needs BLOB_READ_WRITE_TOKEN of the
 * target environment (see seed/media-storage.ts). Demo documents are reset to the values below,
 * edits made in the admin panel to these documents are overwritten.
 *
 * Keys: photos by their source link, services, projects and jobs by the
 * German slug, team by name, testimonials by the German author line.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CollectionSlug,
  getPayload,
  type RequiredDataFromCollectionSlug,
  type TypedCollectionSelect,
  type Where,
} from "payload";
import config from "../src/payload.config";
import {
  homePage,
  jobs,
  PHOTOS,
  type PhotoFile,
  projects,
  services,
  siteSettings,
  team,
  testimonials,
} from "./data";
import { parseManifest } from "./manifest";
import { assertMediaStorage } from "./media-storage";

assertMediaStorage(process.env);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(dirname, "images");

/** Seed runs outside Next.js, so the revalidate hook must stay quiet. */
const context = { disableRevalidate: true };

const payload = await getPayload({ config });

const list = (items: string[]) => items.map((text) => ({ text }));

type Created = "created" | "updated";
const counts: Record<string, Record<Created, number>> = {};
const count = (collection: string, result: Created) => {
  counts[collection] ??= { created: 0, updated: 0 };
  counts[collection][result] += 1;
};

/** What `payload.update` accepts for a collection. */
type UpdateData<S extends CollectionSlug> = Parameters<
  typeof payload.update<S, TypedCollectionSelect[S]>
>[0]["data"];

/**
 * Finds the document by `where` in German, updates it or creates it, then
 * writes the English fields. Returns the document id.
 */
const upsert = async <S extends CollectionSlug>(
  collection: S,
  where: Where,
  de: RequiredDataFromCollectionSlug<S> & UpdateData<S>,
  en: UpdateData<S>,
): Promise<number> => {
  const found = await payload.find({
    collection,
    where,
    locale: "de",
    depth: 0,
    limit: 2,
    pagination: false,
  });
  if (found.docs.length > 1) {
    throw new Error(
      `${collection}: more than one document matches ${JSON.stringify(where)}`,
    );
  }
  const existing = found.docs[0];
  let id: number;
  if (existing) {
    id = Number(existing.id);
    await payload.update({
      collection,
      id,
      data: de,
      locale: "de",
      depth: 0,
      context,
    });
    count(collection, "updated");
  } else {
    const doc = await payload.create({
      collection,
      data: de,
      locale: "de",
      depth: 0,
      context,
    });
    id = Number(doc.id);
    count(collection, "created");
  }
  await payload.update({
    collection,
    id,
    data: en,
    locale: "en",
    depth: 0,
    context,
  });
  return id;
};

const byKey = (ids: Map<string, number>, key: string): number => {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`seed: unknown key "${key}"`);
  }
  return id;
};

payload.logger.info(
  process.env.BLOB_READ_WRITE_TOKEN
    ? "Seed: photos go to Vercel Blob."
    : "Seed: BLOB_READ_WRITE_TOKEN is empty, photos go to the local media/ folder.",
);

// Photos

const manifest = parseManifest(
  await readFile(path.join(imagesDir, "MANIFEST.md"), "utf8"),
);
const photoIds = new Map<string, number>();

for (const file of PHOTOS) {
  const entry = manifest.find((item) => item.file === file);
  if (!entry) {
    throw new Error(`seed: ${file} is missing in MANIFEST.md`);
  }
  const data: RequiredDataFromCollectionSlug<"media"> = {
    alt: entry.alt.de,
    credit: entry.credit,
    source: entry.source,
    license: entry.license,
  };
  const found = await payload.find({
    collection: "media",
    where: { source: { equals: entry.source } },
    locale: "de",
    depth: 0,
    limit: 2,
    pagination: false,
  });
  if (found.docs.length > 1) {
    throw new Error(`media: more than one photo from ${entry.source}`);
  }
  const existing = found.docs[0];
  let id: number;
  if (existing) {
    id = existing.id;
    await payload.update({
      collection: "media",
      id,
      data,
      locale: "de",
      depth: 0,
      context,
    });
    count("media", "updated");
  } else {
    const doc = await payload.create({
      collection: "media",
      data,
      filePath: path.join(imagesDir, file),
      locale: "de",
      depth: 0,
      context,
    });
    id = doc.id;
    count("media", "created");
  }
  await payload.update({
    collection: "media",
    id,
    data: { alt: entry.alt.en },
    locale: "en",
    depth: 0,
    context,
  });
  photoIds.set(file, id);
}

const photo = (file: PhotoFile) => byKey(photoIds, file);

// Services

const serviceIds = new Map<string, number>();
for (const service of services) {
  const shared = {
    cover: photo(service.cover),
    gallery: service.gallery.map(photo),
    order: service.order,
  };
  const localized = (lang: "de" | "en") => {
    const text = service.text[lang];
    return {
      title: text.title,
      slug: text.slug,
      summary: text.summary,
      intro: text.intro,
      included: list(text.included),
      materials: list(text.materials),
      duration: text.duration,
    };
  };
  const id = await upsert(
    "services",
    { slug: { equals: service.text.de.slug } },
    { ...shared, ...localized("de") },
    localized("en"),
  );
  serviceIds.set(service.text.de.slug, id);
}

// Projects

const projectIds = new Map<string, number>();
for (const project of projects) {
  const shared = {
    service: byKey(serviceIds, project.service),
    year: project.year,
    cover: photo(project.cover),
    gallery: project.gallery.map(photo),
    order: project.order,
  };
  const id = await upsert(
    "projects",
    { slug: { equals: project.text.de.slug } },
    { ...shared, ...project.text.de },
    project.text.en,
  );
  projectIds.set(project.text.de.slug, id);
}

// Jobs

for (const job of jobs) {
  const localized = (lang: "de" | "en") => {
    const text = job.text[lang];
    return {
      title: text.title,
      slug: text.slug,
      start: text.start,
      hours: text.hours,
      payText: text.payText ?? null,
      intro: text.intro,
      tasks: list(text.tasks),
      requirements: list(text.requirements),
      benefits: list(text.benefits),
    };
  };
  await upsert(
    "jobs",
    { slug: { equals: job.text.de.slug } },
    {
      active: true,
      employmentType: job.employmentType,
      payMin: job.payMin ?? null,
      payMax: job.payMax ?? null,
      payUnit: job.payUnit ?? null,
      datePosted: job.datePosted,
      validThrough: null,
      order: job.order,
      ...localized("de"),
    },
    localized("en"),
  );
}

// Team

for (const member of team) {
  await upsert(
    "team",
    { name: { equals: member.name } },
    {
      name: member.name,
      since: member.since,
      order: member.order,
      role: member.role.de,
    },
    { role: member.role.en },
  );
}

// Testimonials

for (const testimonial of testimonials) {
  await upsert(
    "testimonials",
    { author: { equals: testimonial.text.de.author } },
    {
      project: byKey(projectIds, testimonial.project),
      order: testimonial.order,
      ...testimonial.text.de,
    },
    testimonial.text.en,
  );
}

// Home page

const home = homePage.text;
const savedHome = await payload.updateGlobal({
  slug: "home-page",
  locale: "de",
  depth: 0,
  context,
  data: {
    hero: { ...home.de.hero, image: photo(homePage.heroImage) },
    featuredProjects: homePage.featuredProjects.map((slug) =>
      byKey(projectIds, slug),
    ),
    processSteps: home.de.processSteps,
    sceneCaptions: home.de.sceneCaptions.map((text) => ({ text })),
    // No principles and no questions: neither the brief nor the mockup has texts for them yet.
    about: {
      ...home.de.about,
      image: photo(homePage.aboutImage),
      principles: [],
    },
    careers: {
      ...home.de.careers,
      image: photo(homePage.careersImage),
      benefits: list(home.de.careers.benefits),
      faq: [],
    },
    meta: home.de.meta,
  },
});

/** Array rows are shared by both languages: English must reuse their ids. */
const rowIds = (rows: { id?: string | null }[]): string[] =>
  rows.map((row) => {
    if (!row.id) {
      throw new Error("seed: array row without id");
    }
    return row.id;
  });

const stepIds = rowIds(savedHome.processSteps);
const captionIds = rowIds(savedHome.sceneCaptions);
const factIds = rowIds(savedHome.hero.facts ?? []);
const benefitIds = rowIds(savedHome.careers.benefits ?? []);
await payload.updateGlobal({
  slug: "home-page",
  locale: "en",
  depth: 0,
  context,
  data: {
    hero: {
      ...home.en.hero,
      image: photo(homePage.heroImage),
      facts: home.en.hero.facts.map((fact, index) => ({
        ...fact,
        id: factIds[index],
      })),
    },
    processSteps: home.en.processSteps.map((step, index) => ({
      ...step,
      id: stepIds[index],
    })),
    sceneCaptions: home.en.sceneCaptions.map((text, index) => ({
      text,
      id: captionIds[index],
    })),
    about: home.en.about,
    careers: {
      ...home.en.careers,
      benefits: home.en.careers.benefits.map((text, index) => ({
        text,
        id: benefitIds[index],
      })),
    },
    meta: home.en.meta,
  },
});

// Site settings

const savedSettings = await payload.updateGlobal({
  slug: "site-settings",
  locale: "de",
  depth: 0,
  context,
  data: {
    company: siteSettings.company,
    tagline: siteSettings.tagline.de,
    openingHours: siteSettings.openingHours.map((row) => ({
      hours: row.hours,
      days: row.days.de,
    })),
    serviceArea: siteSettings.serviceArea.de,
    vacation: { enabled: false, from: null, until: null },
    imprint: siteSettings.imprint.de,
    privacy: siteSettings.privacy.de,
  },
});

const hourIds = rowIds(savedSettings.openingHours);
await payload.updateGlobal({
  slug: "site-settings",
  locale: "en",
  depth: 0,
  context,
  data: {
    openingHours: siteSettings.openingHours.map((row, index) => ({
      id: hourIds[index],
      hours: row.hours,
      days: row.days.en,
    })),
    serviceArea: siteSettings.serviceArea.en,
    tagline: siteSettings.tagline.en,
    imprint: siteSettings.imprint.en,
    privacy: siteSettings.privacy.en,
  },
});

for (const [collection, result] of Object.entries(counts)) {
  payload.logger.info(
    `Seed: ${collection} – ${result.created} created, ${result.updated} updated.`,
  );
}
payload.logger.info("Seed: home page and site settings saved. Done.");

process.exit(0);
