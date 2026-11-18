import { describe, expect, it } from "vitest";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { routing } from "../../src/i18n/routing";

const keyPaths = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("i18n", () => {
  it("has the same message keys in de.json and en.json", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(de).sort());
  });

  it("has no empty messages", () => {
    for (const messages of [de, en]) {
      const empty = keyPaths(messages).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            messages,
          );
        return typeof value !== "string" || value.trim() === "";
      });
      expect(empty).toEqual([]);
    }
  });

  it("translates every pathname into every locale", () => {
    for (const [internal, localized] of Object.entries(routing.pathnames)) {
      expect(typeof localized, internal).toBe("object");
      expect(Object.keys(localized).sort(), internal).toEqual(
        [...routing.locales].sort(),
      );
      for (const path of Object.values(localized)) {
        expect(path.startsWith("/"), `${internal}: ${path}`).toBe(true);
      }
    }
  });
});
