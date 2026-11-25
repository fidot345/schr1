import { devices, expect, type Page, test } from "@playwright/test";
import { axeViolations, watchConsole } from "./support/page-checks";

/*
 * "Vom Brett zum Schrank", BRIEF.md section 4: the scroll builds the
 * wardrobe in a pinned panel and back, the captions follow the steps, the
 * 3D code and the wood textures come only near the section and only from
 * our domain, and with reduced motion, without WebGL or without JavaScript
 * the still picture stands in its place; so it does when the WebGL context
 * is lost or the scene does not load, with a warning that names the cause.
 * On a low screen the steps other than the current one show their name
 * only. The button of the last step leads to the request form.
 */

const SECTION = 'section[aria-labelledby="szene-titel"]';

/**
 * How long the scene may take to arrive and draw its wood. Headless browsers
 * draw WebGL in software; in a parallel local run many of them at once, and
 * the scene then comes after the usual 5 seconds (measured up to about 25
 * from opening the page, with no context lost and no failure, session 36).
 */
const SCENE_ARRIVES = { timeout: 20_000 };
test.describe.configure({ timeout: 60_000 });

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
  await expect(page.locator(`${SECTION} canvas`)).toBeAttached(SCENE_ARRIVES);
  await expect(page.locator(".pin-spacer")).toBeAttached(SCENE_ARRIVES);
}

/** The warning the section leaves when the scene fails, by its code. */
const failureWarning = (code: string) =>
  `warning: [wardrobe-scene] ${code}: the still picture stands in for the 3D scene.`;

/** Whether the console has the warning of `code`; an error that caused it comes after it. */
const warned = (problems: string[], code: string) =>
  problems.some((problem) => problem.startsWith(failureWarning(code)));

/**
 * Chrome's own notice when the photo of the first screen, preloaded, is not
 * drawn within a few seconds: with a phone's pixel density it comes while
 * a test is still busy further down. Not a message of the scene.
 */
const PRELOAD_NOTICE = "was preloaded using link preload but not used";

/** The still picture in place of the panel: picture, all six captions, the button. */
async function expectStill(page: Page) {
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
}

/** Whether the text under each caption's name can be seen (not only read by a screen reader). */
const shownTexts = (page: Page) =>
  page
    .locator(`${SECTION} ol > li`)
    .evaluateAll((items) =>
      items.map(
        (item) =>
          (item.querySelector("p:last-child")?.getBoundingClientRect().height ??
            0) > 1,
      ),
    );

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
    await expect(page.locator(`${SECTION} canvas`)).toBeAttached(SCENE_ARRIVES);
    expect(scripts.length).toBeGreaterThan(atLoad);
    // Once the scene draws, the picture goes.
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);
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
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);

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
      await expect(page.locator(".pin-spacer")).toBeAttached(SCENE_ARRIVES);
      await expect(page.locator(`${SECTION} canvas`)).toBeAttached(
        SCENE_ARRIVES,
      );

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
    // A setting, not a failure: no warning on the console.
    const problems = watchConsole(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await showStill(page);
    expect(problems).toEqual([]);

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
    const problems = watchConsole(page);
    await page.goto("/");
    await showStill(page);

    await expect(page.locator(`${SECTION} canvas`)).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await expect(page.locator(`${SECTION} ol > li`)).toHaveCount(6);
    await expect(button(page)).toBeVisible();
    expect(problems).toEqual([failureWarning("no-webgl2")]);
  });
});

/*
 * The scene fails: the still picture for good, BRIEF.md "Запасной вариант",
 * and a warning with the cause. A phone as Chrome on Android has it (touch,
 * no real shadows) and a computer.
 */
const PIXEL_7 = devices["Pixel 7"];
const FAILING_SCREENS = [
  {
    name: "a computer",
    use: { viewport: { width: 1440, height: 900 } },
    screens: 3,
  },
  {
    name: "a Pixel 7",
    use: {
      viewport: PIXEL_7.viewport,
      userAgent: PIXEL_7.userAgent,
      deviceScaleFactor: PIXEL_7.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    },
    screens: 2.5,
  },
];

for (const { name, use, screens } of FAILING_SCREENS) {
  test.describe(`the still picture when the scene fails on ${name}`, () => {
    test.use(use);

    test("loses the WebGL context halfway through: the picture in the panel's place", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await comeNear(page);
      // The wardrobe is drawn: the flat picture has gone.
      await expect(page.locator(`${SECTION} img`)).toHaveCount(
        0,
        SCENE_ARRIVES,
      );
      const start = await pinStart(page);
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + 0.5 * screens * use.viewport.height,
      );
      await expect.poll(() => markedStep(page)).toBe(3);

      // What the browser does to a phone short of memory or sent to the background.
      await page
        .locator(`${SECTION} canvas`)
        .evaluate((canvas: HTMLCanvasElement) =>
          canvas
            .getContext("webgl2")
            ?.getExtension("WEBGL_lose_context")
            ?.loseContext(),
        );

      await expectStill(page);
      await expect(
        page.locator(SECTION).getByRole("heading", { level: 2 }),
      ).toBeInViewport();
      // The warning with the cause, and nothing from three or React.
      expect(
        problems.filter((problem) => !problem.includes(PRELOAD_NOTICE)),
      ).toEqual([failureWarning("context-lost")]);
    });

    test("a texture does not load: the picture instead", async ({ page }) => {
      const problems = watchConsole(page);
      await page.route("**/textures/oak/normal.webp", (route) => route.abort());
      await page.goto("/");
      await page.locator(SECTION).scrollIntoViewIfNeeded();

      await expectStill(page);
      expect(warned(problems, "scene-error")).toBe(true);
    });

    test("the 3D code does not load: the picture instead", async ({ page }) => {
      const problems = watchConsole(page);
      await page.goto("/");
      await page.waitForLoadState("load");
      // Every script from here on fails, the scene's chunk among them.
      await page.route("**/_next/static/chunks/**", (route) => route.abort());
      await page.locator(SECTION).scrollIntoViewIfNeeded();

      await expectStill(page);
      expect(warned(problems, "scene-error")).toBe(true);
    });
  });
}

test.describe("captions on a low screen", () => {
  test("1280 x 720: the text of the current step only, the others by their name", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await comeNear(page);
    const start = await pinStart(page);

    // Scroll progress and the step it marks, BRIEF.md "Раскадровка".
    for (const [progress, marked] of [
      [0.02, 1],
      [0.48, 3],
      [0.98, 6],
    ]) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + progress * 3 * 720,
      );
      // The scrub catches up with the scroll over a few frames.
      await expect.poll(() => markedStep(page)).toBe(marked);
      await expect
        .poll(() => shownTexts(page))
        .toEqual([1, 2, 3, 4, 5, 6].map((step) => step === marked));
      // Heading, every name and the current text on screen.
      await expect(
        page.locator(SECTION).getByRole("heading", { level: 2 }),
      ).toBeInViewport({ ratio: 1 });
      for (const item of await page.locator(`${SECTION} ol > li`).all()) {
        await expect(item).toBeInViewport({ ratio: 1 });
      }
    }
    // The other texts stay there for screen readers.
    await expect(page.locator(`${SECTION} ol`)).toContainText(
      "Jedes Teil wird",
    );
  });

  test("1440 x 900: every text", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await comeNear(page);

    expect(await shownTexts(page)).toEqual(Array(6).fill(true));
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
