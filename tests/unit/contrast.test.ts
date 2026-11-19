import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

const color = (name: string): string => {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`));
  if (!match) throw new Error(`No color token --color-${name}`);
  return match[1];
};

// WCAG 2.2 relative luminance and contrast ratio.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (foreground: string, background: string): number => {
  const [light, dark] = [
    luminance(color(foreground)),
    luminance(color(background)),
  ].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

describe("contrast of token pairs (BRIEF.md section 3)", () => {
  it.each([
    ["graphit", "papier"],
    ["graphit", "weiss"],
    ["graphit", "moos"],
  ])("body text %s on %s passes AAA (7:1)", (text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(7);
  });

  it.each([
    // primary button and its hover / pressed state
    ["weiss", "tannengruen"],
    ["weiss", "tannengruen-dunkel"],
    // secondary button, text button and links
    ["tannengruen", "papier"],
    ["tannengruen", "weiss"],
    ["tannengruen", "moos"],
    ["tannengruen-dunkel", "papier"],
    ["tannengruen-dunkel", "moos"],
  ])("text %s on %s passes AA (4.5:1)", (text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["tannengruen", "papier"],
    ["tannengruen", "weiss"],
    ["tannengruen", "moos"],
  ])(
    "outline %s (focus ring, secondary border) on %s passes 3:1",
    (line, background) => {
      expect(contrast(line, background)).toBeGreaterThanOrEqual(3);
    },
  );
});
