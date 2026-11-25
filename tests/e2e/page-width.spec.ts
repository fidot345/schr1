import { devices, expect, type Page, test } from "@playwright/test";

/*
 * No page is wider than the window, all the way down: not on first paint,
 * not when the 3D scene arrives and pins its panel, not further down.
 * Session 36: on an Android phone the logo pushed "Menü" past the edge, the
 * page got a blank strip on the right and the bars did not fill the width.
 *
 * Phones as Chrome on Android has them (Pixel 7: touch, mobile viewport,
 * its user agent) at the widths of common phones, the tablet as a plain
 * window. A phone browser widens its layout viewport to content that
 * sticks out, and window.innerWidth grows with it: the check compares with
 * the width of the device.
 */

const PIXEL_7 = devices["Pixel 7"];
const PHONE = {
  userAgent: PIXEL_7.userAgent,
  deviceScaleFactor: PIXEL_7.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
};

const SCREENS = [
  { name: "360 px phone", viewport: { width: 360, height: 800 }, ...PHONE },
  { name: "393 px phone", viewport: { width: 393, height: 852 }, ...PHONE },
  { name: "Pixel 7 (412 px)", viewport: PIXEL_7.viewport, ...PHONE },
  { name: "430 px phone", viewport: { width: 430, height: 932 }, ...PHONE },
  { name: "768 px tablet", viewport: { width: 768, height: 1024 } },
];

const PAGES = ["/", "/karriere", "/anfrage"] as const;

/** The 3D scene can come late in a parallel local run (software WebGL), see wardrobe.spec.ts. */
const SCENE_ARRIVES = { timeout: 20_000 };

/** How wide the browser lays the page out and how wide it can scroll. */
const widths = (page: Page) =>
  page.evaluate(() => ({
    layout: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));

/**
 * Everything that reaches past `width`, for the failure message. Not what a
 * box with hidden or scrolled overflow keeps inside (the sr-only spam trap
 * of the forms is such a box).
 */
const sticksOut = (page: Page, width: number) =>
  page.evaluate((width) => {
    const clipped = (element: Element) => {
      for (let box = element.parentElement; box; box = box.parentElement) {
        if (getComputedStyle(box).overflowX !== "visible") return true;
      }
      return false;
    };
    return [...document.body.querySelectorAll("*")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > width + 0.5 &&
          !clipped(element),
      )
      .map((element) => {
        const right = Math.round(element.getBoundingClientRect().right);
        const text = element.textContent?.trim().slice(0, 30);
        return `<${element.tagName.toLowerCase()} class="${element.getAttribute("class")}"> to ${right} px: ${text}`;
      });
  }, width);

async function expectNoSidewaysScroll(page: Page, width: number, at: string) {
  const measured = await widths(page);
  if (measured.layout !== width || measured.scroll !== width) {
    expect(await sticksOut(page, width), at).toEqual([]);
  }
  expect(measured, at).toEqual({ layout: width, scroll: width });
}

for (const { name, ...screen } of SCREENS) {
  const { width, height } = screen.viewport;

  test.describe(`at ${name}`, () => {
    test.use(screen);

    for (const path of PAGES) {
      test(`${path} never scrolls sideways, all the way down`, async ({
        page,
      }) => {
        // The home page is long with the pin, and the scene is drawn in
        // software at a phone's pixel density.
        if (path === "/") test.slow();
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await expectNoSidewaysScroll(page, width, "on first paint");

        if (path === "/") {
          // The scene loads near its section and adds the pin to the page.
          const scene = page.locator('section[aria-labelledby="szene-titel"]');
          await scene.scrollIntoViewIfNeeded();
          await expect(scene.locator("canvas")).toBeAttached(SCENE_ARRIVES);
          await expect(page.locator(".pin-spacer")).toBeAttached(SCENE_ARRIVES);
        }

        const bottom = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        for (let y = 0; y <= bottom; y += height) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(50);
          await expectNoSidewaysScroll(page, width, `at ${y} px`);
        }
      });
    }
  });
}

/*
 * Production showed the company name in the logo: SiteSettings had no logo
 * word yet, and the header falls back to the name (lib/text.ts). The seed
 * has "Tannrieder", so the test puts the longer words in itself: the
 * fallback, which takes two lines, and a single word of 30 letters, the
 * most the field takes, which breaks where it has to.
 */
const LOGO_WORDS = [
  { word: "Schreinerei Tannrieder", lines: 2 },
  { word: "Tannriederschreinereiwerkstatt", lines: 3 },
];

/** The phone header: 64 px, the 1px line included; two logo lines fit. */
const HEADER_HEIGHT = 64;

test.describe("a long logo word at 360 px", () => {
  test.use({ viewport: { width: 360, height: 800 }, ...PHONE });

  for (const { word, lines } of LOGO_WORDS) {
    test(`"${word}" wraps next to "Menü"`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((word) => {
        for (const name of document.querySelectorAll(
          'body > header a[href="/"] .font-display',
        )) {
          name.textContent = word;
        }
      }, word);

      await expectNoSidewaysScroll(page, 360, "with the long word");
      await expect(page.getByRole("button", { name: "Menü" })).toBeInViewport({
        ratio: 1,
      });
      const header = await page
        .locator("body > header")
        .evaluate((element) => element.getBoundingClientRect().height);
      if (lines <= 2) expect(header).toBe(HEADER_HEIGHT);
    });
  }
});
