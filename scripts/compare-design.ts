/*
 * Takes screenshots of our pages for the comparison with the mockup
 * (docs/REDESIGN.md, "Главные правила", point 8).
 *
 * Run with the dev server going:
 *
 *   node scripts/compare-design.ts            all pairs
 *   node scripts/compare-design.ts 01a logo   only pairs whose name contains
 *                                             one of the words
 *
 * BASE_URL changes the address of the site (default http://localhost:3000).
 *
 * Every pair is "page + selector + width". The screenshot goes to
 * .design-compare/ and is named like the screenshot of the mockup it belongs
 * to. Scale is the same as in design/screenshots: 2 for sections and the
 * phone, 1 for a whole page. Next to it you open
 * design/screenshots/<mockup>.png and compare: 2px tolerance for sizes and
 * paddings, colors exactly.
 *
 * Where our capture is the same crop as the mockup screenshot (sameCrop),
 * the script also compares the sizes and reports a difference over 2px.
 *
 * Later sessions add their pairs to PAIRS. Not part of CI.
 */

import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

type Pair = {
  /** File name in .design-compare/ (without .png). */
  name: string;
  /** Page of our site. */
  path: string;
  /** CSS selector of the block to capture; the whole page when missing. */
  selector?: string;
  /** Viewport width in px: 1440 desktop, 390 phone. */
  width: number;
  /** 2 for sections and the phone, 1 for a whole page. */
  scale: 1 | 2;
  /** The screenshot in design/screenshots/ (without .png) it belongs to. */
  mockup: string;
  /** What to look at in the mockup screenshot, when it is only a part of it. */
  hint?: string;
  /** Our capture is the same crop as the mockup screenshot: compare sizes. */
  sameCrop?: boolean;
  /**
   * A wider tolerance than 2px for sizes, only where the difference follows
   * from the type scale (docs/REDESIGN.md, rule 2) and is explained here.
   */
  tolerancePx?: number;
};

const PAIRS: readonly Pair[] = [
  // Session 2: components on /dev/ui, against the parts of 01a, 01b and 01k.
  {
    name: "devui-logo-voll",
    path: "/dev/ui",
    selector: "#dev-logo-full",
    width: 1440,
    scale: 2,
    mockup: "01a-kopfzeile",
    hint: "Logo links in der Kopfzeile",
  },
  {
    name: "devui-logo-kompakt",
    path: "/dev/ui",
    selector: "#dev-logo-compact",
    width: 1440,
    scale: 2,
    mockup: "04-startseite-mobil",
    hint: "Logo links in der Kopfzeile",
  },
  {
    name: "devui-logo-hell",
    path: "/dev/ui",
    selector: "#dev-logo-light",
    width: 1440,
    scale: 2,
    mockup: "01k-fusszeile",
    hint: "Logo oben links im Fuß",
  },
  {
    name: "devui-schaltflaechen",
    path: "/dev/ui",
    selector: 'section[aria-labelledby="dev-buttons"]',
    width: 1440,
    scale: 2,
    mockup: "01b-erster-bildschirm",
    hint: "Projekt anfragen und Jobs bei uns unter dem Text; Menü und Anrufen in 04",
  },
  // Session 3: header, footer and mobile bar of the home page.
  {
    name: "01a-kopfzeile",
    path: "/",
    selector: "header",
    width: 1440,
    scale: 2,
    mockup: "01a-kopfzeile",
    sameCrop: true,
  },
  {
    name: "01k-fusszeile",
    path: "/",
    selector: "footer",
    width: 1440,
    scale: 2,
    mockup: "01k-fusszeile",
    sameCrop: true,
    // The mockup sets the 16px and 15px lines with a line height of 1.6, the
    // scale has 1.5 for them: 1.6px on the headings, 1.5px on the last line.
    tolerancePx: 4,
  },
  {
    name: "04-kopfzeile",
    path: "/",
    selector: "header",
    width: 390,
    scale: 2,
    mockup: "04-startseite-mobil",
    hint: "Kopfzeile oben, 64px hoch",
  },
  {
    name: "04-leiste",
    path: "/",
    selector: 'nav[aria-label="Schnellkontakt"]',
    width: 390,
    scale: 2,
    mockup: "04-startseite-mobil",
    hint: "Leiste Anrufen / Anfrage unten, 81px hoch",
  },
];

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, ".design-compare");
const MOCKUP_DIR = path.join(ROOT, "design", "screenshots");
const TOLERANCE_PX = 2;

/** Width and height of a PNG, read from its IHDR chunk. */
function pngSize(file: Buffer): { width: number; height: number } {
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
}

async function readMockupSize(name: string, scale: number) {
  try {
    const { width, height } = pngSize(
      await readFile(path.join(MOCKUP_DIR, `${name}.png`)),
    );
    return { width: width / scale, height: height / scale };
  } catch {
    return undefined;
  }
}

const words = process.argv.slice(2);
const selected = PAIRS.filter(
  (pair) =>
    words.length === 0 || words.some((word) => pair.name.includes(word)),
);

if (selected.length === 0) {
  console.error(`Нет пар по запросу: ${words.join(", ")}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
let failed = 0;

try {
  for (const pair of selected) {
    const context = await browser.newContext({
      viewport: { width: pair.width, height: 900 },
      deviceScaleFactor: pair.scale,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const file = path.join(OUT_DIR, `${pair.name}.png`);

    try {
      // "load", not "networkidle": a production server prefetches the links
      // of pages that do not exist yet, and the network never goes quiet.
      await page.goto(`${BASE_URL}${pair.path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

      if (pair.selector) {
        await page.locator(pair.selector).first().screenshot({ path: file });
      } else {
        await page.screenshot({ path: file, fullPage: true });
      }
    } catch (error) {
      failed += 1;
      const reason =
        error instanceof Error ? error.message.split("\n")[0] : error;
      console.error(`✗ ${pair.name}: ${reason}`);
      await context.close();
      continue;
    }

    const ours = pngSize(await readFile(file));
    const size = {
      width: ours.width / pair.scale,
      height: ours.height / pair.scale,
    };
    let line = `✓ ${pair.name}: ${size.width}×${size.height}px`;

    if (pair.sameCrop) {
      const mockup = await readMockupSize(pair.mockup, pair.scale);
      if (!mockup) {
        line += ` (нет design/screenshots/${pair.mockup}.png)`;
      } else {
        const dw = size.width - mockup.width;
        const dh = size.height - mockup.height;
        const limit = pair.tolerancePx ?? TOLERANCE_PX;
        const over = Math.abs(dw) > limit || Math.abs(dh) > limit;
        failed += over ? 1 : 0;
        line += ` · макет ${mockup.width}×${mockup.height}px · разница ${dw}/${dh}px${over ? ` ✗ больше ${limit}px` : ""}`;
      }
    } else {
      line += ` · сравни с design/screenshots/${pair.mockup}.png${pair.hint ? ` (${pair.hint})` : ""}`;
    }

    console.log(line);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nСнимки лежат в ${path.relative(ROOT, OUT_DIR)}/`);
process.exit(failed > 0 ? 1 : 0);
