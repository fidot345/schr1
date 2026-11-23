import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { packIco } from "../../src/lib/ico";
import { render } from "./support/render";

const MARK = "public/images/logo-mark.svg";
const APP_ICON = "src/app/icon.svg";

const read = (path: string): string => readFileSync(path, "utf8");

/** The four rectangles of a mark as "x y width height rx", in order. */
const rectsOf = (markup: string): string[] =>
  [...markup.matchAll(/<rect\b[^>]*>/g)].map((rect) =>
    ["x", "y", "width", "height", "rx"]
      .map((name) => rect[0].match(new RegExp(`\\s${name}="([^"]*)"`))?.[1])
      .join(" "),
  );

describe("logo mark", () => {
  const svg = read(MARK);

  it("has a viewBox", () => {
    expect(svg).toMatch(/<svg[^>]*\sviewBox="[^"]+"/);
  });

  it("is the fir tree from the mockup: four rectangles in a 30 x 34 box", () => {
    expect(svg).toMatch(/\sviewBox="0 0 30 34"/);
    expect(rectsOf(svg)).toEqual([
      "10 2 10 5 1",
      "5 10 20 5 1",
      "0 18 30 5 1",
      "12.5 25 5 9 1",
    ]);
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

  it("is the same shape as the inline mark of the Logo component", () => {
    const html = render(<Logo name="Tannrieder" />);

    expect(rectsOf(html)).toEqual(rectsOf(svg));
  });
});

describe("LogoMark (the Payload admin draws its logo with it)", () => {
  it("keeps the proportions of the mark: size is the height", () => {
    const html = render(<LogoMark size={96} alt="Tannrieder" />);

    expect(html).toMatch(/height="96"/);
    expect(html).toMatch(/width="85"/);
    expect(html).toMatch(/alt="Tannrieder"/);
  });

  it("points at the mark file", () => {
    expect(render(<LogoMark size={24} alt="" />)).toContain("logo-mark.svg");
  });
});

describe("Logo", () => {
  it("full: mark, descriptor above the name, 28px name", () => {
    const html = render(
      <Logo variant="full" name="Tannrieder" descriptor="Schreinerei" />,
    );

    expect(html).toMatch(/<svg[^>]*width="30"[^>]*height="34"/);
    expect(html.indexOf("Schreinerei")).toBeLessThan(
      html.indexOf("Tannrieder"),
    );
    expect(html).toContain("text-[1.75rem]");
    expect(html).toContain("text-tannengruen");
  });

  it("compact: no descriptor, 24px name", () => {
    const html = render(
      <Logo variant="compact" name="Tannrieder" descriptor="Schreinerei" />,
    );

    expect(html).not.toContain("Schreinerei");
    expect(html).toMatch(/<svg[^>]*width="24"[^>]*height="27"/);
    expect(html).toContain("text-[1.5rem]");
  });

  it("light: Moos mark and Weiß name for the Graphit footer", () => {
    const html = render(<Logo variant="light" name="Tannrieder" />);

    expect(html).toMatch(/<svg[^>]*width="26"[^>]*height="30"/);
    expect(html).toContain("text-moos");
    expect(html).toContain("text-weiss");
    expect(html).not.toContain("text-tannengruen");
  });

  it("hides the mark from assistive technology: the name already says it", () => {
    expect(render(<Logo name="Tannrieder" />)).toMatch(
      /<svg[^>]*aria-hidden="true"/,
    );
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
