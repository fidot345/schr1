import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { packIco } from "../../src/lib/ico";

const MARK = "public/images/logo-mark.svg";
const APP_ICON = "src/app/icon.svg";

const read = (path: string): string => readFileSync(path, "utf8");

describe("logo mark", () => {
  const svg = read(MARK);

  it("has a viewBox", () => {
    expect(svg).toMatch(/<svg[^>]*\sviewBox="[^"]+"/);
  });

  it("has no external references, text or embedded images", () => {
    expect(svg).not.toMatch(/<(text|image|use|style|script|foreignObject)\b/);
    expect(svg).not.toMatch(/href=/);
    expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', "")).not.toMatch(
      /https?:\/\//,
    );
  });

  it("uses only Tannengrün", () => {
    const colors = svg.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    expect(colors.length).toBeGreaterThan(0);
    expect(new Set(colors.map((color) => color.toUpperCase()))).toEqual(
      new Set(["#1F4537"]),
    );
  });

  it("is copied unchanged to src/app/icon.svg", () => {
    expect(read(APP_ICON)).toBe(svg);
  });
});

describe("packIco", () => {
  it("writes the ICO header and directory entries", () => {
    const first = new Uint8Array([1, 2, 3]);
    const second = new Uint8Array([4, 5]);
    const ico = packIco([
      { size: 16, png: first },
      { size: 256, png: second },
    ]);
    const view = new DataView(ico.buffer);

    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);

    expect(view.getUint8(6)).toBe(16);
    expect(view.getUint32(6 + 8, true)).toBe(3);
    expect(view.getUint32(6 + 12, true)).toBe(38);

    expect(view.getUint8(22)).toBe(0);
    expect(view.getUint32(22 + 8, true)).toBe(2);
    expect(view.getUint32(22 + 12, true)).toBe(41);

    expect([...ico.slice(38)]).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects sizes ICO cannot store", () => {
    expect(() => packIco([{ size: 512, png: new Uint8Array() }])).toThrow(
      RangeError,
    );
  });
});
