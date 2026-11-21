import AxeBuilder from "@axe-core/playwright";
import type { ConsoleMessage, Page } from "@playwright/test";

/* Checks every page test shares: console, axe and going down the page. */

export const AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

/*
 * TEMP(stage-4): the request form, which the site links to but which does
 * not exist yet, in German and in English. In a production build next/link
 * prefetches it and the browser logs a 404. Only such 404s are ignored;
 * delete this when the form is built.
 */
const NOT_BUILT_YET = /^(\/en)?\/(anfrage|request)(\/|$)/;

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const isMissingPage = (message: ConsoleMessage): boolean =>
  /status of 404/.test(message.text()) &&
  NOT_BUILT_YET.test(pathOf(message.location().url));

/** Everything the browser reports as an error or a warning, and uncaught errors. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const type = message.type();
    if ((type === "error" || type === "warning") && !isMissingPage(message)) {
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
