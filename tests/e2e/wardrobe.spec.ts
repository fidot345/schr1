import { devices, expect, type Page, test } from "@playwright/test";
import { axeViolations, watchConsole } from "./support/page-checks";

/*
 * "Vom Brett zum Schrank", BRIEF.md section 4: the scroll builds the
 * wardrobe in a pinned panel and back, the captions follow the steps, the
 * 3D code and the wood textures come only near the section and only from
 * our domain, and with reduced motion, without WebGL or without JavaScript
 * the still picture stands in its place. A lost WebGL context builds the
 * scene anew, lighter, up to three times; only then, or when the scene does
 * not load, comes the still picture, with a warning that names the cause.
 * A weak phone starts with the light scene. On a phone the wardrobe fills
 * most of a tall scene. On a low screen the steps other than the current
 * one show their name only. The button of the last step leads to the
 * request form.
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

/** The warning of the scene each time it is built anew, `rebuild` of 3. */
const rebuildWarning = (code: string, rebuild: number) =>
  `warning: [wardrobe-scene] ${code}: the scene is built anew, lighter (${rebuild} of 3).`;

/** Whether the console has the warning of `code`; an error that caused it comes after it. */
const warned = (problems: string[], code: string) =>
  problems.some((problem) => problem.startsWith(failureWarning(code)));

type Device = { memory: number; cores: number };
/**
 * Makes the browser tell `memory` GiB and `cores` cores, as Chrome on
 * Android does; headless Chromium tells the cores of the machine it runs
 * on. For page.addInitScript, with the device as its argument.
 */
const tellDevice = ({ memory, cores }: Device) => {
  Object.defineProperty(Navigator.prototype, "deviceMemory", {
    get: () => memory,
  });
  Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
    get: () => cores,
  });
};
const STRONG_PHONE: Device = { memory: 8, cores: 8 };
const WEAK_PHONE: Device = { memory: 2, cores: 8 };

/** The canvas of the scene: pixels per CSS pixel and whether its edges are smoothed. */
const canvasOf = (page: Page) =>
  page.locator(`${SECTION} canvas`).evaluate((canvas: HTMLCanvasElement) => ({
    density: canvas.width / canvas.clientWidth,
    antialias: canvas.getContext("webgl2")?.getContextAttributes()?.antialias,
  }));

/**
 * Takes the WebGL context of the scene away, as the browser does on a phone
 * short of memory or after a reset of the GPU, and gives it back after a
 * moment when `restore`. The canvas is marked, so a new one can be told
 * apart from it.
 */
async function loseContext(page: Page, { restore }: { restore: boolean }) {
  await page
    .locator(`${SECTION} canvas`)
    .evaluate(async (canvas: HTMLCanvasElement, restore) => {
      const extension = canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context");
      if (!extension) throw new Error("the scene has no context to lose");
      canvas.dataset.lost = "";
      const lost = new Promise((resolve) =>
        canvas.addEventListener("webglcontextlost", resolve, { once: true }),
      );
      extension.loseContext();
      await lost;
      if (restore) setTimeout(() => extension.restoreContext(), 200);
    }, restore);
}

/** Waits for the scene built anew: a new canvas with the wood drawn, the picture gone. */
async function expectBuiltAnew(page: Page) {
  await expect(page.locator(`${SECTION} canvas[data-lost]`)).toHaveCount(
    0,
    SCENE_ARRIVES,
  );
  await expect(page.locator(`${SECTION} canvas`)).toHaveCount(1);
  await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);
}

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
    /schrank-fertig\.avif/,
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

    test("gives the scene most of the window", async ({ page }) => {
      await comeNear(page);
      // Drawn, so sized: a canvas fresh in the page is 300 × 150.
      await expect(page.locator(`${SECTION} img`)).toHaveCount(
        0,
        SCENE_ARRIVES,
      );
      const box = await page.locator(`${SECTION} canvas`).boundingBox();
      if (!box) throw new Error("the scene has no canvas");

      // A computer: three fifths of the row next to the captions, all the
      // height under the header. A phone: the width, above one caption.
      expect(box.height / height).toBeGreaterThanOrEqual(0.6);
      expect(box.width / width).toBeGreaterThanOrEqual(
        width >= 768 ? 0.45 : 0.88,
      );
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
      /schrank-fertig\.avif/,
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
      /schrank-fertig\.avif/,
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
    // The warning tells whether WebGL 1 is there; three.js needs WebGL 2.
    expect(problems).toEqual([
      `${failureWarning("no-webgl2")} No WebGL at all.`,
    ]);
  });

  test("with reduced motion: says so on the console, but not as a warning", async ({
    page,
  }) => {
    const notes: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "info") notes.push(message.text());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await showStill(page);

    await expect
      .poll(() => notes)
      .toContain(
        "[wardrobe-scene] reduced-motion: the still picture, as the system asks for less motion.",
      );
  });
});

/** Chrome on Android on a Pixel 7: touch, no real shadows. */
const PIXEL_7 = devices["Pixel 7"];
const ON_PIXEL_7 = {
  viewport: PIXEL_7.viewport,
  userAgent: PIXEL_7.userAgent,
  deviceScaleFactor: PIXEL_7.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
};
const FAILING_SCREENS = [
  {
    name: "a computer",
    use: { viewport: { width: 1440, height: 900 } },
    screens: 3,
  },
  { name: "a Pixel 7", use: ON_PIXEL_7, screens: 2.5 },
];

/** Waits for the wood, then scrolls halfway through the pin, to step 3. */
async function halfway(page: Page, screens: number, height: number) {
  await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);
  const start = await pinStart(page);
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    start + 0.5 * screens * height,
  );
  await expect.poll(() => markedStep(page)).toBe(3);
  return start;
}

/** What the console has, without Chrome's notice about the preloaded photo. */
const ownProblems = (problems: string[]) =>
  problems.filter((problem) => !problem.includes(PRELOAD_NOTICE));

/*
 * The browser takes the WebGL context away, BRIEF.md "Запасной вариант"
 * (Maxon, session 37): the scene is built anew, lighter, and keeps its
 * place in the story, up to three times. The fourth loss brings the still
 * picture for good. A phone and a computer, both strong, so the first
 * scene is the full one.
 */
for (const { name, use, screens } of FAILING_SCREENS) {
  test.describe(`a lost WebGL context on ${name}`, () => {
    test.use(use);
    test.beforeEach(({ page }) => page.addInitScript(tellDevice, STRONG_PHONE));

    test("halfway through: the scene is built anew, lighter, at the same step", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await comeNear(page);
      const start = await halfway(page, screens, use.viewport.height);
      expect((await canvasOf(page)).antialias).toBe(true);

      await loseContext(page, { restore: true });

      await expectBuiltAnew(page);
      const lighter = await canvasOf(page);
      expect(lighter.antialias).toBe(false);
      expect(lighter.density).toBeLessThanOrEqual(1.5);
      // Still pinned at the same step, and it goes on from there.
      expect(await markedStep(page)).toBe(3);
      const top = await page
        .locator(".pin-spacer > div")
        .evaluate((element) => element.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThan(2);
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + 0.98 * screens * use.viewport.height,
      );
      await expect.poll(() => markedStep(page)).toBe(6);
      await expect(button(page)).toBeVisible();
      expect(ownProblems(problems)).toEqual([
        rebuildWarning("context-lost", 1),
      ]);
    });

    test("a context that does not come back: the picture, then a new scene", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await comeNear(page);
      await halfway(page, screens, use.viewport.height);

      await loseContext(page, { restore: false });

      // The picture of the finished wardrobe while the scene waits for its context.
      await expect(page.locator(`${SECTION} img`)).toHaveCount(1);
      await expectBuiltAnew(page);
      expect(await markedStep(page)).toBe(3);
      expect(ownProblems(problems)).toEqual([
        rebuildWarning("context-lost", 1),
      ]);
    });

    test("lost again and again: the picture in the panel's place after three new builds", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await comeNear(page);
      await halfway(page, screens, use.viewport.height);

      for (let rebuild = 1; rebuild <= 3; rebuild++) {
        await loseContext(page, { restore: true });
        await expectBuiltAnew(page);
      }
      await loseContext(page, { restore: true });

      await expectStill(page);
      await expect(
        page.locator(SECTION).getByRole("heading", { level: 2 }),
      ).toBeInViewport();
      // The warnings with the cause, and nothing from three or React.
      expect(ownProblems(problems)).toEqual([
        rebuildWarning("context-lost", 1),
        rebuildWarning("context-lost", 2),
        rebuildWarning("context-lost", 3),
        failureWarning("context-lost"),
      ]);
    });
  });

  test.describe(`the still picture when the scene does not load on ${name}`, () => {
    test.use(use);

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

test.describe("a renderer that gets no context", () => {
  test("is made anew, lighter: no smooth edges this time", async ({ page }) => {
    // WebGL 2 is there, but not with smooth edges, as on a phone short of memory.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        options?: { antialias?: boolean },
      ) {
        if (type === "webgl2" && options?.antialias) return null;
        return (
          getContext as (...args: unknown[]) => RenderingContext | null
        ).call(this, type, options);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    const problems = watchConsole(page);
    await comeNear(page);
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);

    expect((await canvasOf(page)).antialias).toBe(false);
    expect(ownProblems(problems)).toContain(rebuildWarning("no-context", 1));
    expect(warned(problems, "no-context")).toBe(false);
  });
});

test.describe("how much the scene asks of a phone", () => {
  test.use(ON_PIXEL_7);

  test("a weak phone starts with the light scene: no smoothing, 1.5 pixels per CSS pixel", async ({
    page,
  }) => {
    await page.addInitScript(tellDevice, WEAK_PHONE);
    const problems = watchConsole(page);
    await comeNear(page);
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);

    const canvas = await canvasOf(page);
    expect(canvas.antialias).toBe(false);
    expect(canvas.density).toBeCloseTo(1.5, 1);
    expect(ownProblems(problems)).toEqual([]);
  });

  test("a strong phone draws the brief's scene: smooth edges, 1.75 pixels per CSS pixel", async ({
    page,
  }) => {
    await page.addInitScript(tellDevice, STRONG_PHONE);
    await comeNear(page);
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);

    const canvas = await canvasOf(page);
    expect(canvas.antialias).toBe(true);
    expect(canvas.density).toBeCloseTo(1.75, 1);
  });
});

/**
 * How much of the canvas the oak takes, across and up (1 is all of it), and
 * whether it keeps off the edges of the canvas: from a screenshot, by the
 * warm colour of the wood. Papier, the wall (Moos), the floor (Linie), the
 * shadows, the metal and the green button are not warm.
 */
async function oakOf(page: Page) {
  const shot = await page.locator(`${SECTION} canvas`).screenshot();
  return page.evaluate(async (png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const board = document.createElement("canvas");
    board.width = image.width;
    board.height = image.height;
    const context = board.getContext("2d");
    if (!context) throw new Error("no 2D canvas");
    context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(
      0,
      0,
      board.width,
      board.height,
    );
    let [left, right, top, bottom] = [width, -1, height, -1];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const at = (y * width + x) * 4;
        const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
        if (red - blue > 40 && red > 80 && red >= green) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    return {
      across: (right - left + 1) / width,
      up: (bottom - top + 1) / height,
      inside: left > 0 && top > 0 && right < width - 1 && bottom < height - 1,
    };
  }, shot.toString("base64"));
}

/*
 * On a phone the scene stays on screen above one caption and takes most of
 * the height, and the finished wardrobe fills it: most of its width on a
 * tall scene, most of its height on a low one (Maxon, session 37). Pixel 7
 * and the widths 360 to 430 at 640 and 900 high.
 */
const PHONES = [
  { name: "a Pixel 7", use: ON_PIXEL_7 },
  ...[360, 393, 412, 430].flatMap((width) =>
    [640, 900].map((height) => ({
      name: `${width} x ${height}`,
      use: {
        viewport: { width, height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    })),
  ),
];

for (const { name, use } of PHONES) {
  test.describe(`the wardrobe on ${name}`, () => {
    test.use(use);

    test("fills most of a scene that takes most of the screen", async ({
      page,
    }) => {
      await comeNear(page);
      await expect(page.locator(`${SECTION} img`)).toHaveCount(
        0,
        SCENE_ARRIVES,
      );
      const start = await pinStart(page);
      const screen = use.viewport;
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + 0.98 * 2.5 * screen.height,
      );
      await expect.poll(() => markedStep(page)).toBe(6);

      const box = await page.locator(`${SECTION} canvas`).boundingBox();
      if (!box) throw new Error("the scene has no canvas");
      expect(box.height / screen.height).toBeGreaterThanOrEqual(0.5);
      expect(box.width / screen.width).toBeGreaterThanOrEqual(0.88);

      // The scrub and the camera settle over a few frames.
      if (box.width / box.height <= 0.75) {
        await expect
          .poll(async () => (await oakOf(page)).across, SCENE_ARRIVES)
          .toBeGreaterThanOrEqual(0.7);
      } else {
        await expect
          .poll(async () => (await oakOf(page)).up, SCENE_ARRIVES)
          .toBeGreaterThanOrEqual(0.85);
      }
      expect((await oakOf(page)).inside).toBe(true);
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
      /schrank-fertig\.avif/,
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
