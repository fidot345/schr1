import { expect, type Page, test } from "@playwright/test";
import { axeViolations, watchConsole } from "./support/page-checks";

/*
 * "Vom Brett zum Schrank", BRIEF.md section 4: the scroll builds the
 * wardrobe in a pinned panel and back, the captions follow the steps, the
 * 3D code and the wood textures come only near the section and only from
 * our domain, and with reduced motion, without WebGL or without JavaScript
 * the still picture stands in its place. The button of the last step leads
 * to the request form.
 */

const SECTION = 'section[aria-labelledby="szene-titel"]';

/** Scroll lengths of the pin: three screens on a computer, two and a half on a phone. */
const SCREENS = [
  { name: "1440 px", width: 1440, height: 900, screens: 3 },
  { name: "390 px", width: 390, height: 844, screens: 2.5 },
] as const;

/** The number of the marked step, 0 when none is marked. */
const markedStep = (page: Page) =>
  page.locator(SECTION).evaluate((section) => {
    const items = [...section.querySelectorAll("ol > li")];
    return items.findIndex((item) => item.ariaCurrent === "step") + 1;
  });

/** The button of the last step, to the request form. */
const button = (page: Page, name = "Projekt anfragen") =>
  page.locator(SECTION).getByRole("link", { name });

/** Where the pin starts, on the page. */
const pinStart = (page: Page) =>
  page.evaluate(() => {
    const spacer = document.querySelector(".pin-spacer");
    if (!spacer) throw new Error("the panel is not pinned");
    return spacer.getBoundingClientRect().top + window.scrollY;
  });

/**
 * Goes to the section and waits for the still picture. The server renders
 * the panel of the scene with step 1 marked; the browser swaps it for the
 * still picture, which marks no step, so the section element is replaced.
 */
async function showStill(page: Page) {
  await page.evaluate((selector) => {
    document.querySelector(selector)?.scrollIntoView();
  }, SECTION);
  await expect(page.locator(`${SECTION} [aria-current]`)).toHaveCount(0);
}

/** Goes near the section, so the scene loads and pins its panel. */
async function comeNear(page: Page) {
  await page.goto("/");
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await expect(page.locator(`${SECTION} canvas`)).toBeAttached();
  await expect(page.locator(".pin-spacer")).toBeAttached();
}

for (const { name, width, height, screens } of SCREENS) {
  test.describe(`the scene at ${name}`, () => {
    test.use({ viewport: { width, height } });

    test("builds the wardrobe step by step and takes it apart again", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await comeNear(page);
      const start = await pinStart(page);
      const length = screens * height;

      // Down: the panel stays at the top, the marked step follows the scroll.
      const seen: number[] = [];
      for (const progress of [0.02, 0.25, 0.48, 0.65, 0.82, 0.98]) {
        await page.evaluate(
          (y) => window.scrollTo(0, y),
          start + progress * length,
        );
        await expect.poll(() => markedStep(page)).toBe(seen.length + 1);
        seen.push(await markedStep(page));
        const top = await page
          .locator(".pin-spacer > div")
          .evaluate((element) => element.getBoundingClientRect().top);
        expect(Math.abs(top)).toBeLessThan(2);
        // The marked caption is on screen, the last one too.
        await expect(
          page.locator(`${SECTION} li[aria-current="step"]`),
        ).toBeInViewport({ ratio: 1 });
        // The button comes only with the finished wardrobe.
        if (seen.length < 6) await expect(button(page)).toBeHidden();
      }
      expect(seen).toEqual([1, 2, 3, 4, 5, 6]);
      await expect(button(page)).toBeVisible();
      await expect(button(page)).toBeInViewport();

      // Up again: back to the first step, the button goes again.
      await page.evaluate((y) => window.scrollTo(0, y), start);
      await expect.poll(() => markedStep(page)).toBe(1);
      await expect(button(page)).toBeHidden();

      // After the last step the page goes on.
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + length + height,
      );
      await expect(page.locator("#projekte")).toBeInViewport();

      expect(problems).toEqual([]);
    });

    test("hides the canvas from screen readers and has no axe violations", async ({
      page,
    }) => {
      await comeNear(page);

      await expect(
        page
          .locator(`${SECTION} canvas`)
          .locator("xpath=ancestor::div[@aria-hidden='true']"),
      ).toHaveCount(1);
      await expect(page.locator(`${SECTION} ol > li`)).toHaveCount(6);
      expect(await axeViolations(page)).toEqual([]);
    });

    test("leads from the finished wardrobe to the request form", async ({
      page,
    }) => {
      await comeNear(page);
      const start = await pinStart(page);
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + 0.98 * screens * height,
      );
      await expect.poll(() => markedStep(page)).toBe(6);
      await expect(button(page)).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await button(page).click();
      await expect(page).toHaveURL(/\/anfrage$/);
    });
  });
}

test.describe("loading", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("brings the 3D code only when the section comes near", async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    const atLoad = scripts.length;
    await expect(page.locator(`${SECTION} canvas`)).toHaveCount(0);
    await expect(page.locator(`${SECTION} img`)).toHaveAttribute(
      "src",
      /schrank-platzhalter\.svg/,
    );

    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await expect(page.locator(`${SECTION} canvas`)).toBeAttached();
    expect(scripts.length).toBeGreaterThan(atLoad);
    // Once the scene draws, the picture goes.
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0);
  });

  test("takes the wood textures from our own domain and nothing from others", async ({
    page,
    baseURL,
  }) => {
    const textures: { url: string; status: number }[] = [];
    const foreign: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/textures/")) {
        textures.push({ url, status: response.status() });
      }
    });
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(baseURL ?? "") && !url.startsWith("data:")) {
        foreign.push(url);
      }
    });

    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    // The picture stays until the wardrobe has its wood.
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0);

    expect(textures.map(({ url }) => new URL(url).pathname).sort()).toEqual([
      "/textures/birch/color.webp",
      "/textures/oak/color.webp",
      "/textures/oak/normal.webp",
      "/textures/oak/roughness.webp",
    ]);
    expect(textures.every(({ status }) => status === 200)).toBe(true);
    expect(foreign).toEqual([]);
  });
});

test.describe("opened below the section", () => {
  for (const { name, width, height } of SCREENS) {
    test(`keeps the projects in view while the scene arrives at ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/#projekte");
      await expect(page.locator(".pin-spacer")).toBeAttached();
      await expect(page.locator(`${SECTION} canvas`)).toBeAttached();

      await expect(page.locator("#projekte")).toBeInViewport();
      // Past the pin, the scene shows the finished wardrobe.
      await expect.poll(() => markedStep(page)).toBe(6);
    });
  }
});

test.describe("the skip link", () => {
  test("takes the keyboard past the animation to the projects", async ({
    page,
  }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Animation überspringen" });
    await skip.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#projekte$/);
    await expect(page.locator("#projekte")).toBeInViewport();
  });

  test("goes on past the hidden button of the last step", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Animation überspringen" }).focus();
    await page.keyboard.press("Tab");

    const inScene = await page.evaluate(
      (selector) => document.activeElement?.closest(selector) !== null,
      SECTION,
    );
    expect(inScene).toBe(false);
  });
});

test.describe("the still picture instead of the scene", () => {
  test("with reduced motion: picture and all captions, nothing pinned", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await showStill(page);

    await expect(page.locator(`${SECTION} canvas`)).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator(`${SECTION} img`)).toHaveAttribute(
      "src",
      /schrank-platzhalter\.svg/,
    );
    await expect(page.locator(`${SECTION} ol > li`)).toHaveCount(6);
    for (const item of await page.locator(`${SECTION} ol > li`).all()) {
      await expect(item).toBeVisible();
      await expect(item).not.toHaveAttribute("aria-current");
    }
    await expect(button(page)).toBeVisible();
    await expect(button(page)).toHaveAttribute("href", "/anfrage");
  });

  test("without WebGL: the same picture", async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type.startsWith("webgl")) return null;
        return (
          getContext as (...args: unknown[]) => RenderingContext | null
        ).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto("/");
    await showStill(page);

    await expect(page.locator(`${SECTION} canvas`)).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator(`${SECTION} ol > li`)).toHaveCount(6);
    await expect(button(page)).toBeVisible();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  /** The still picture comes from <noscript>, with a heading id of its own. */
  const STILL = 'section[aria-labelledby="szene-titel-bild"]';

  test("shows the picture, all captions and the button instead of the panel", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator(SECTION)).toBeHidden();
    const still = page.locator(STILL);
    await expect(still).toBeVisible();
    await expect(
      still.getByRole("heading", { name: "Vom Brett zum Schrank" }),
    ).toBeVisible();
    await expect(still.locator("img")).toHaveAttribute(
      "src",
      /schrank-platzhalter\.svg/,
    );
    await expect(still.locator("ol > li")).toHaveCount(6);
    for (const item of await still.locator("ol > li").all()) {
      await expect(item).toBeVisible();
    }
    const request = still.getByRole("link", { name: "Projekt anfragen" });
    await expect(request).toBeVisible();
    await expect(request).toHaveAttribute("href", "/anfrage");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("skips the picture with the keyboard", async ({ page }) => {
    await page.goto("/");
    const skip = page
      .locator(STILL)
      .getByRole("link", { name: "Animation überspringen" });
    await skip.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#projekte$/);
    await expect(page.locator("#projekte")).toBeInViewport();
  });
});
