import type { Media } from "@/payload-types";

/**
 * A relation from Payload is either the populated document or, when it was
 * not populated (depth too low, document deleted or not readable), its id.
 */
export const isPopulated = <T extends object>(
  value: number | T | null | undefined,
): value is T => typeof value === "object" && value !== null;

/** Only the populated documents of a hasMany relation, in their order. */
export const populated = <T extends object>(
  values: readonly (number | T | null | undefined)[] | null | undefined,
): T[] => (values ?? []).filter(isPopulated);

/** A photo from the Media collection, ready for next/image. */
export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position from the focal point set in the admin panel. */
  position: string;
};

const percent = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 50;

/**
 * The photo of a Media document, or null when it cannot be shown: not
 * populated, no file, no size or no alt text.
 */
export const toPhoto = (
  media: number | Media | null | undefined,
): Photo | null => {
  if (!isPopulated(media)) return null;
  const { url, width, height, alt } = media;
  if (!url || !width || !height || !alt) return null;

  return {
    src: url,
    alt,
    width,
    height,
    position: `${percent(media.focalX)}% ${percent(media.focalY)}%`,
  };
};
