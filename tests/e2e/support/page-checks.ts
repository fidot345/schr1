import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/* Checks every page test shares: console, axe and going down the page. */

export const AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

/*
 * Headless Chromium has no GPU and draws WebGL with SwiftShader. Showing the
 * 3D scene then makes the browser's own GL driver report a stall when it
 * copies the canvas back. It is not a message of the page: with a real GPU
 * (Chrome with --enable-gpu, D3D11) the console stays empty.
 */
const SOFTWARE_GL_NOTICE =
  /^\[\.WebGL-[^\]]+\]GL Driver Message \(OpenGL, Performance, [^)]+\): GPU stall due to ReadPixels/;

/** Everything the browser reports as an error or a warning, and uncaught errors. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const type = message.type();
    if (type === "warning" && SOFTWARE_GL_NOTICE.test(message.text())) return;
    if (type === "error" || type === "warning") {
      problems.push(`${type}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

/**
 * Opens a page and goes down it once. Links are prefetched when they come into
 * view, so a request that fails below the fold shows up too. Ends at the top.
 */
export async function openAndScroll(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
  // The prefetches start right after the links come into view.
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
}

/** The axe violations of the open page, one line each: "rule: targets". */
export async function axeViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .analyze();

  return violations.map(
    ({ id, nodes }) =>
      `${id}: ${nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}
