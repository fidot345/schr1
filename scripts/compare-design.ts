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
  // Session 4: the first four sections of the home page, whole sections.
  {
    name: "01b-erster-bildschirm",
    path: "/",
    selector: 'section[aria-labelledby="hero-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01b-erster-bildschirm",
    sameCrop: true,
    // The list under the hero (17px) has 1.5 in the scale, 1.6 in the mockup.
    tolerancePx: 4,
  },
  {
    name: "01c-leistungen",
    path: "/",
    selector: 'section[aria-labelledby="leistungen-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01c-leistungen",
    sameCrop: true,
    // The card text (17px) has a line height of 1.5 in the scale, 1.6 in the
    // mockup: -1.7px per line, -5px on the longest card of three lines. The
    // title is 26px (h3) instead of 24px: +2.4px. In all, about -3px.
    tolerancePx: 4,
  },
  {
    name: "01d-3d-szene",
    path: "/",
    selector: 'section[aria-labelledby="szene-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01d-3d-szene",
    sameCrop: true,
  },
  {
    name: "01e-projekte",
    path: "/",
    selector: 'section[aria-labelledby="projekte-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01e-projekte",
    sameCrop: true,
  },
  // Session 5: the other five sections and the whole home page.
  {
    name: "01f-ablauf",
    path: "/",
    selector: 'section[aria-labelledby="ablauf-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01f-ablauf",
    sameCrop: true,
    // The step texts (17px, two lines) have a line height of 1.5 in the scale,
    // 1.6 in the mockup: -1.7px per line, -3px in all.
    tolerancePx: 4,
  },
  {
    name: "01g-jobs",
    path: "/",
    selector: 'section[aria-labelledby="jobs-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01g-jobs",
    sameCrop: true,
  },
  {
    name: "01h-familie",
    path: "/",
    selector: 'section[aria-labelledby="familie-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01h-familie",
    sameCrop: true,
  },
  {
    name: "01i-kundenstimmen",
    path: "/",
    selector: 'section[aria-labelledby="stimmen-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01i-kundenstimmen",
    sameCrop: true,
  },
  {
    name: "01j-kontakt",
    path: "/",
    selector: 'section[aria-labelledby="kontakt-titel"]',
    width: 1440,
    scale: 2,
    mockup: "01j-kontakt",
    sameCrop: true,
  },
  {
    name: "01-startseite-komplett",
    path: "/",
    width: 1440,
    scale: 1,
    mockup: "01-startseite-komplett",
    sameCrop: true,
    // The sum of the differences of the sections above, all from the line
    // height of the scale (1.5) against the mockup (1.6): footer -4, hero -2,
    // services -3, process -3, and +1, -1, +1 from the 3D section, projects
    // and testimonials. The page is about 10px shorter in all.
    tolerancePx: 12,
  },
  {
    name: "04-erster-bildschirm",
    path: "/",
    selector: 'section[aria-labelledby="hero-titel"]',
    width: 390,
    scale: 2,
    mockup: "04-startseite-mobil",
    hint: "Foto, Überschrift und Schaltflächen zwischen Kopfzeile und Leiste; unter den Schaltflächen folgt bei uns noch die Liste der Fakten",
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
        const target = page.locator(pair.selector).first();
        // A section far down the page is scrolled into view for the capture,
        // and the sticky header and phone bar would cover its edge. They stay
        // in the flow when made static, so the layout does not move.
        if (
          !(await target.evaluate((el) => el.hasAttribute("data-sticky-bar")))
        ) {
          await page.addStyleTag({
            content: "[data-sticky-bar]{position:static !important}",
          });
        }
        await target.screenshot({ path: file });
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
