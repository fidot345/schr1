import { describe, expect, it } from "vitest";
import { isPopulated, populated, toPhoto } from "@/lib/media";
import { brandWord, paragraphs } from "@/lib/text";
import type { Media } from "@/payload-types";

const media = (overrides: Partial<Media> = {}): Media => ({
  id: 1,
  alt: "Werkbank mit Hobel",
  license: "unsplash",
  updatedAt: "2026-11-20T00:00:00.000Z",
  createdAt: "2026-11-20T00:00:00.000Z",
  url: "/api/media/file/werkbank.jpg",
  width: 2400,
  height: 1600,
  focalX: 30,
  focalY: 70,
  ...overrides,
});

describe("isPopulated / populated", () => {
  it("tells a populated document from an id", () => {
    expect(isPopulated(media())).toBe(true);
    expect(isPopulated(4)).toBe(false);
    expect(isPopulated(null)).toBe(false);
    expect(isPopulated(undefined)).toBe(false);
  });

  it("keeps only populated documents, in order", () => {
    const first = media({ id: 1 });
    const second = media({ id: 2 });
    expect(populated([first, 7, null, second])).toEqual([first, second]);
    expect(populated(null)).toEqual([]);
  });
});

describe("toPhoto", () => {
  it("returns src, alt, size and the focal point as object-position", () => {
    expect(toPhoto(media())).toEqual({
      src: "/api/media/file/werkbank.jpg",
      alt: "Werkbank mit Hobel",
      width: 2400,
      height: 1600,
      position: "30% 70%",
    });
  });

  it("centers the crop without a focal point and clamps odd values", () => {
    expect(toPhoto(media({ focalX: null, focalY: undefined }))?.position).toBe(
      "50% 50%",
    );
    expect(toPhoto(media({ focalX: -5, focalY: 140 }))?.position).toBe(
      "0% 100%",
    );
  });

  it("returns null for what cannot be shown", () => {
    expect(toPhoto(3)).toBeNull();
    expect(toPhoto(null)).toBeNull();
    expect(toPhoto(media({ url: null }))).toBeNull();
    expect(toPhoto(media({ width: null }))).toBeNull();
    expect(toPhoto(media({ alt: "" }))).toBeNull();
  });
});

describe("paragraphs", () => {
  it("splits at empty lines and keeps single line breaks", () => {
    expect(paragraphs("Erster Satz.\nNoch dazu.\n\nZweiter Absatz.")).toEqual([
      "Erster Satz.\nNoch dazu.",
      "Zweiter Absatz.",
    ]);
  });

  it("handles Windows line breaks, blank lines with spaces and empty text", () => {
    expect(paragraphs("Eins.\r\n  \r\nZwei.\n\n\n\nDrei.")).toEqual([
      "Eins.",
      "Zwei.",
      "Drei.",
    ]);
    expect(paragraphs("")).toEqual([]);
    expect(paragraphs(null)).toEqual([]);
  });
});

describe("brandWord", () => {
  it("takes the family name from the company name", () => {
    expect(brandWord("Schreinerei Tannrieder")).toBe("Tannrieder");
    expect(brandWord("  Schreinerei   Tannrieder ")).toBe("Tannrieder");
    expect(brandWord("Tannrieder")).toBe("Tannrieder");
  });
});
