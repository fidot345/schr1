import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * BRIEF.md section 4 "Загрузка": the code of the 3D scene (three, fiber,
 * drei, GSAP) comes only with the lazy scene, so it does not weigh on the
 * first load of the home page. The section reaches it through next/dynamic
 * alone: nothing it imports at once may import that code (session 40:
 * STEP_RANGES from parts.ts brought 100 KB of three into the home page and,
 * by the prefetch of its link, into every other page).
 */

const SCENE_CODE = /^(three|@react-three\/.+|gsap|@gsap\/react)(\/.*)?$/;

/** `import … from "x"`, `export … from "x"` and `import "x"`, not `import type`. */
const STATIC_IMPORT =
  /^\s*(?:import|export)\s+(?!type\s)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;

/** The file of a module of src, or null for a package or a non-code file. */
function sourceFile(importer: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? resolve("src", specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importer), specifier)
      : null;
  if (!base) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`];
  return (
    candidates.find(
      (candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate),
    ) ?? null
  );
}

/** Every package that `entry` imports at once, through modules of src too. */
function packagesImportedAtOnce(entry: string): Set<string> {
  const packages = new Set<string>();
  const seen = new Set<string>();
  const queue = [resolve(entry)];
  for (let file = queue.pop(); file; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier] of readFileSync(file, "utf8").matchAll(
      STATIC_IMPORT,
    )) {
      const source = sourceFile(file, specifier);
      if (source) queue.push(source);
      else if (!specifier.startsWith(".")) packages.add(specifier);
    }
  }
  return packages;
}

describe("the 3D scene on the first load", () => {
  it("is reached by the section only through its lazy import", () => {
    const packages = packagesImportedAtOnce(
      "src/components/wardrobe/WardrobeSection.tsx",
    );

    expect(packages).toContain("next/dynamic");
    expect([...packages].filter((name) => SCENE_CODE.test(name))).toEqual([]);
  });

  it("finds the scene code where it is imported", () => {
    const packages = packagesImportedAtOnce(
      "src/components/wardrobe/WardrobeScene.tsx",
    );

    expect([...packages].filter((name) => SCENE_CODE.test(name))).toEqual(
      expect.arrayContaining(["three", "@react-three/fiber", "gsap"]),
    );
  });
});
