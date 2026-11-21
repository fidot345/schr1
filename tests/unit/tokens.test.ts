import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

const declaration = (property: string): string | undefined =>
  css.match(new RegExp(`^\\s*${property}:\\s*([^;]+);`, "m"))?.[1].trim();

/** docs/REDESIGN.md "Токены", Цвета. Biome writes hex in lower case. */
const COLORS = {
  papier: "#F8F9F7",
  weiss: "#FFFFFF",
  graphit: "#24282A",
  schiefer: "#5B6266",
  linie: "#D6DBD8",
  feldrand: "#7C8482",
  tannengruen: "#1F4537",
  "tannengruen-dunkel": "#15332A",
  moos: "#E4EBE6",
  fehler: "#B42318",
} as const;

/** docs/REDESIGN.md "Токены", Шкала текста: size (rem of the px value), line height, weight. */
const TEXT_SCALE = {
  display: ["clamp(2.25rem, 4.4vw, 3.75rem)", "1.05", "700"],
  h1: ["clamp(2.25rem, 3.6vw, 3.25rem)", "1.08", "700"],
  h2: ["clamp(1.75rem, 2.8vw, 2.5rem)", "1.15", "600"],
  h3: ["1.625rem", "1.2", "600"],
  h4: ["1.375rem", "1.25", "600"],
  "tel-lg": ["clamp(2.125rem, 3.4vw, 3rem)", "1.1", "700"],
  tel: ["2rem", "1.15", "700"],
  lead: ["1.125rem", "1.6", "400"],
  body: ["1.0625rem", "1.6", "400"],
  ui: ["1.0625rem", "1.5", "400"],
  small: ["1rem", "1.5", "400"],
  xs: ["0.9375rem", "1.5", "400"],
} as const;

describe("design tokens (docs/REDESIGN.md)", () => {
  it("resets the default Tailwind palette and has exactly the 10 colors", () => {
    expect(declaration("--color-\\*")).toBe("initial");
    const names = [...css.matchAll(/^\s*--color-([a-z-]+):/gm)].map(
      (match) => match[1],
    );
    expect(names.sort()).toEqual(Object.keys(COLORS).sort());
  });

  it.each(Object.entries(COLORS))("color %s is %s", (name, hex) => {
    expect(declaration(`--color-${name}`)?.toUpperCase()).toBe(hex);
  });

  it("resets the default text sizes and has exactly the 12 steps", () => {
    expect(declaration("--text-\\*")).toBe("initial");
    // lead and body are declared twice: phone size and the md override.
    const steps = new Set(
      [...css.matchAll(/^\s*--text-([a-z][a-z0-9]*(?:-[a-z0-9]+)*):/gm)].map(
        (match) => match[1],
      ),
    );
    expect([...steps].sort()).toEqual(Object.keys(TEXT_SCALE).sort());
  });

  it.each(Object.entries(TEXT_SCALE))(
    "text step %s has its size, line height and weight",
    (name, [size, lineHeight, weight]) => {
      expect(declaration(`--text-${name}`)).toBe(size);
      expect(declaration(`--text-${name}--line-height`)).toBe(lineHeight);
      expect(declaration(`--text-${name}--font-weight`)).toBe(weight);
    },
  );

  it("grows lead and body from the phone size at md", () => {
    expect(css).toMatch(
      /@variant md \{\s*--text-lead: 1\.25rem;\s*--text-body: 1\.125rem;/,
    );
  });

  it("names the two fonts font-display and font-sans", () => {
    expect(declaration("--font-display")).toBe("var(--font-zilla-slab), serif");
    expect(declaration("--font-sans")).toContain("var(--font-atkinson)");
  });

  it("keeps the 4px spacing unit, one 4px radius and no shadows", () => {
    expect(declaration("--spacing")).toBeUndefined();
    expect(declaration("--radius")).toBe("0.25rem");
    expect(declaration("--radius-\\*")).toBe("initial");
    expect(declaration("--shadow-\\*")).toBe("initial");
  });

  it("sets the container to 1280px with the fluid side margin", () => {
    expect(declaration("--container-page")).toBe("80rem");
    expect(declaration("--spacing-gutter")).toBe("clamp(1.25rem, 3vw, 2.5rem)");
  });
});
