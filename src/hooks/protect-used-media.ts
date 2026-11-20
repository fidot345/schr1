import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionSlug,
  type Field,
  type PayloadRequest,
  type TypedLocale,
} from "payload";

export const MEDIA_SLUG = "media";

/** HTTP 409 Conflict: the photo is still needed elsewhere. */
const CONFLICT = 409;

export type MediaFieldRef = {
  /** Dot path for queries, e.g. `hero.image`. */
  path: string;
  /** German field label for the error message. */
  label: string;
  /** The value differs per language. */
  localized: boolean;
};

const relatesToMedia = (relationTo: string | string[]): boolean =>
  Array.isArray(relationTo)
    ? relationTo.includes(MEDIA_SLUG)
    : relationTo === MEDIA_SLUG;

const labelText = (label: unknown, fallback: string): string => {
  if (typeof label === "string") {
    return label;
  }
  if (typeof label === "object" && label !== null && "de" in label) {
    const de = (label as Record<string, unknown>).de;
    if (typeof de === "string") {
      return de;
    }
  }
  return fallback;
};

type Parent = MediaFieldRef;

const ROOT: Parent = { path: "", label: "", localized: false };

const join = (head: string, tail: string, separator: string): string =>
  head ? `${head}${separator}${tail}` : tail;

/**
 * Every upload or relationship field in `fields` that points to media.
 * Labels of named groups and arrays are kept: „Erster Bildschirm › Foto“.
 */
export const findMediaFields = (
  fields: Field[],
  parent: Parent = ROOT,
): MediaFieldRef[] =>
  fields.flatMap((field): MediaFieldRef[] => {
    if (field.type === "row" || field.type === "collapsible") {
      return findMediaFields(field.fields, parent);
    }
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) =>
        "name" in tab && tab.name
          ? findMediaFields(tab.fields, {
              path: join(parent.path, tab.name, "."),
              label: join(parent.label, labelText(tab.label, tab.name), " › "),
              localized: parent.localized || tab.localized === true,
            })
          : findMediaFields(tab.fields, parent),
      );
    }
    if (!("name" in field) || !field.name) {
      return field.type === "group"
        ? findMediaFields(field.fields, parent)
        : [];
    }
    const self: Parent = {
      path: join(parent.path, field.name, "."),
      label: join(
        parent.label,
        labelText("label" in field ? field.label : undefined, field.name),
        " › ",
      ),
      localized:
        parent.localized || ("localized" in field && field.localized === true),
    };
    if (field.type === "group" || field.type === "array") {
      return findMediaFields(field.fields, self);
    }
    if (field.type === "blocks") {
      return field.blocks.flatMap((block) =>
        findMediaFields(block.fields, self),
      );
    }
    if (
      (field.type === "upload" || field.type === "relationship") &&
      relatesToMedia(field.relationTo)
    ) {
      return [self];
    }
    return [];
  });

const sameId = (value: unknown, id: number | string): boolean => {
  if (typeof value === "object" && value !== null && "id" in value) {
    return sameId(value.id, id);
  }
  return (
    (typeof value === "number" || typeof value === "string") &&
    String(value) === String(id)
  );
};

/** All values at a dot path; arrays on the way are walked row by row. */
const valuesAt = (data: unknown, segments: string[]): unknown[] => {
  if (Array.isArray(data)) {
    return data.flatMap((item) => valuesAt(item, segments));
  }
  const [head, ...rest] = segments;
  if (head === undefined) {
    return [data];
  }
  if (typeof data !== "object" || data === null) {
    return [];
  }
  return valuesAt((data as Record<string, unknown>)[head], rest);
};

type Locale = TypedLocale | undefined;

const localesFor = (req: PayloadRequest, refs: MediaFieldRef[]): Locale[] => {
  const { localization } = req.payload.config;
  return refs.some((ref) => ref.localized) && localization
    ? (localization.localeCodes as TypedLocale[])
    : [undefined];
};

/**
 * Where a media document is still used, as German lines like
 * `Leistung „Küchen“ (Titelbild)`. Internal `payload-*` collections are
 * skipped: a locked or remembered photo is not a real use.
 */
export const findMediaUsage = async (
  req: PayloadRequest,
  id: number | string,
): Promise<string[]> => {
  const { payload } = req;
  const usages = new Set<string>();

  for (const collection of payload.config.collections) {
    if (collection.slug.startsWith("payload-")) {
      continue;
    }
    const refs = findMediaFields(collection.fields);
    const singular = labelText(collection.labels.singular, collection.slug);
    const titleField = collection.admin.useAsTitle ?? "id";
    for (const ref of refs) {
      for (const locale of localesFor(req, [ref])) {
        const result = await payload.find({
          collection: collection.slug as CollectionSlug,
          where: { [ref.path]: { in: [id] } },
          depth: 0,
          limit: 20,
          locale,
          req,
        });
        for (const doc of result.docs) {
          const title = (doc as unknown as Record<string, unknown>)[titleField];
          const name = typeof title === "string" ? title : `ID ${doc.id}`;
          usages.add(`${singular} „${name}“ (${ref.label})`);
        }
      }
    }
  }

  for (const global of payload.config.globals) {
    const refs = findMediaFields(global.fields);
    if (refs.length === 0) {
      continue;
    }
    const label = labelText(global.label, global.slug);
    for (const locale of localesFor(req, refs)) {
      const doc = await payload.findGlobal({
        slug: global.slug,
        depth: 0,
        locale,
        req,
      });
      for (const ref of refs) {
        if (valuesAt(doc, ref.path.split(".")).some((v) => sameId(v, id))) {
          usages.add(`${label} (${ref.label})`);
        }
      }
    }
  }

  return [...usages];
};

/**
 * Stops deleting a photo that a page still shows. Without this the database
 * rejects the delete with a technical error (required cover) or silently
 * drops the photo from a gallery.
 */
export const protectUsedMedia: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const usages = await findMediaUsage(req, id);
  if (usages.length === 0) {
    return;
  }
  const media = await req.payload.findByID({
    collection: MEDIA_SLUG,
    id,
    depth: 0,
    req,
    disableErrors: true,
  });
  const name = media?.filename ? `„${media.filename}“` : "Dieses Bild";
  throw new APIError(
    `${name} kann nicht gelöscht werden, weil es noch verwendet wird: ${usages.join("; ")}. Bitte das Bild dort zuerst ersetzen oder entfernen.`,
    CONFLICT,
  );
};
