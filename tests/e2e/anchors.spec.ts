import { expect, type Page, test } from "@playwright/test";
import { watchConsole } from "./support/page-checks";

/*
 * Links to a part of a page (#id): the jump lands on the target, right
 * under the sticky header (scroll margin 16 px), not under it. The trial
 * day's button on /karriere and /en/careers goes through the router
 * (?stelle=schnuppertag#bewerben): it lands after a plain click, right
 * after the wheel while Lenis still moves the page, and again on the
 * address that is already open, where it chooses the trial day again. The
 * home page's button lands on the form of the next page. The plain anchors
 * "Zum Inhalt springen" and "Animation überspringen" land the same way.
 */

const TRIAL = {
  de: {
    path: "/karriere",
    button: "Schnuppertag anfragen",
    trialDay: "Schnuppertag / Praktikum",
    otherJob: "Schreiner (m/w/d)",
  },
  en: {
    path: "/en/careers",
    button: "Request a trial day",
    trialDay: "Taster day / internship",
    otherJob: "Joiner (m/f/d)",
  },
} as const;

/** The gap between the bottom of the sticky header and the top of `selector`. */
const belowHeader = (page: Page, selector: string) =>
  page.evaluate((target) => {
    const header = document.querySelector("header");
    const element = document.querySelector(target);
    if (!header || !element) return Number.NaN;
    return Math.round(
      element.getBoundingClientRect().top -
        header.getBoundingClientRect().bottom,
    );
  }, selector);

/** The target sits 16 px under the header: the scroll margin of globals.css. */
async function expectLandedOn(page: Page, selector: string) {
  await expect
    .poll(async () => {
      const gap = await belowHeader(page, selector);
      return gap >= 12 && gap <= 20 ? "landed" : `${gap} px under the header`;
    })
    .toBe("landed");
}

const form = (page: Page) =>
  page.locator("form").filter({ has: page.locator("#application-name") });

/** Waits until React took over the page: before that, a click is the browser's. */
async function openHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => {
    const element = document.querySelector("#application-name");
    return (
      element !== null &&
      Object.keys(element).some((key) => key.startsWith("__react"))
    );
  });
}

for (const [language, texts] of Object.entries(TRIAL)) {
  test.describe(`the trial day's button (${language})`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("lands on the form, under the header, with the trial day chosen", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await openHydrated(page, texts.path);
      await page.getByRole("link", { name: texts.button }).click();

      await expect(page).toHaveURL(
        new RegExp(`${texts.path}\\?stelle=schnuppertag#bewerben$`),
      );
      await expectLandedOn(page, "#bewerben");
      await expect(page.locator("#bewerben-titel")).toBeInViewport();
      await expect(
        form(page).getByRole("radio", { name: texts.trialDay }),
      ).toBeChecked();
      expect(problems).toEqual([]);
    });

    test("lands on the form right after the wheel, while the page still glides", async ({
      page,
    }) => {
      await openHydrated(page, texts.path);
      const button = page.getByRole("link", { name: texts.button });
      await page.mouse.move(700, 450);
      // Wheel until the button is in the upper half: Lenis glides on.
      for (let turn = 0; turn < 60; turn += 1) {
        const box = await button.boundingBox();
        if (box && box.y > 80 && box.y < 450) break;
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(50);
      }
      const box = await button.boundingBox();
      if (!box) throw new Error("the button is not on the page");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      await expectLandedOn(page, "#bewerben");
      // The glide does not carry the page away afterwards.
      await page.waitForTimeout(800);
      await expectLandedOn(page, "#bewerben");
    });

    test("lands again on the address that is open, and chooses the trial day again", async ({
      page,
    }) => {
      await openHydrated(page, `${texts.path}?stelle=schnuppertag#bewerben`);
      const other = form(page).getByRole("radio", {
        name: texts.otherJob,
        exact: true,
      });
      await other.check();
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator("#bewerben-titel")).not.toBeInViewport();

      const button = page.getByRole("link", { name: texts.button });
      await button.focus();
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(
        new RegExp(`${texts.path}\\?stelle=schnuppertag#bewerben$`),
      );
      await expectLandedOn(page, "#bewerben");
      const trial = form(page).getByRole("radio", { name: texts.trialDay });
      await expect(trial).toBeChecked();
      await expect(trial).toBeFocused();
    });
  });
}

test.describe("links to a part of a page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the home page's trial day button lands on the form of /karriere", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await page.goto("/");
    await page.getByRole("link", { name: "Schnuppertag anfragen" }).click();

    await expect(page).toHaveURL(/\/karriere\?stelle=schnuppertag#bewerben$/);
    await expectLandedOn(page, "#bewerben");
    expect(problems).toEqual([]);
  });

  test("the trial day's button lands on the form on a phone, too", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHydrated(page, "/karriere");
    await page.getByRole("link", { name: "Schnuppertag anfragen" }).click();

    const trial = form(page).getByRole("radio", {
      name: TRIAL.de.trialDay,
    });
    await expect(trial).toBeChecked();
    await expect(trial).toBeFocused();
    // The chosen card is on screen, between the header and the bottom bar.
    await expect(trial.locator("xpath=ancestor::label[1]")).toBeInViewport({
      ratio: 1,
    });
    expect(await belowHeader(page, "#bewerben")).toBeLessThanOrEqual(20);
  });

  test("Animation überspringen lands on the projects, under the header", async ({
    page,
  }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Animation überspringen" });
    await skip.scrollIntoViewIfNeeded();
    // The scene pins its panel when it arrives, which moves the projects
    // down: the jump comes after that, as for a reader.
    await expect(page.locator(".pin-spacer")).toBeAttached({ timeout: 20_000 });
    await skip.click();

    await expect(page).toHaveURL(/#projekte$/);
    await expectLandedOn(page, "#projekte");
  });

  test("Zum Inhalt springen goes to the main content", async ({ page }) => {
    await page.goto("/karriere");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Zum Inhalt springen" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#main$/);
    // <main> starts right under the header: the page stays at the top.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.keyboard.press("Tab");
    const inMain = await page.evaluate(
      () => document.activeElement?.closest("main") !== null,
    );
    expect(inMain).toBe(true);
  });
});
