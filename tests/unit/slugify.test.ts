import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugify } from "../../src/lib/slugify";

describe("slugify", () => {
  it("writes German umlauts and ß out", () => {
    expect(slugify("Küchen")).toBe("kuechen");
    expect(slugify("Wohnküche in Eiche")).toBe("wohnkueche-in-eiche");
    expect(slugify("Über uns")).toBe("ueber-uns");
    expect(slugify("Straße")).toBe("strasse");
  });

  it("drops accents, punctuation and outer dashes", () => {
    expect(slugify("  Café – Türen & Möbel!  ")).toBe("cafe-tueren-moebel");
    expect(slugify("Schreiner (m/w/d)")).toBe("schreiner-m-w-d");
  });

  it("produces slugs that match the slug pattern", () => {
    for (const title of [
      "Badmöbel aus Nussbaum",
      "Innentüren für einen Altbau",
    ]) {
      expect(slugify(title)).toMatch(SLUG_PATTERN);
    }
  });

  it("rejects malformed slugs", () => {
    for (const slug of [
      "Kuechen",
      "kü",
      "-kitchens",
      "kitchens-",
      "a--b",
      "",
    ]) {
      expect(SLUG_PATTERN.test(slug), slug).toBe(false);
    }
  });
});
