import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * Stage 1 "done when", BRIEF.md section 6: every component on /dev/ui in
 * both languages, everything reachable by Tab with a visible focus ring,
 * no axe violations. /dev/ui exists only in `next dev`, which is what
 * playwright.config.ts starts.
 */

const DEV_UI = ["/dev/ui", "/en/dev/ui"];
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

/** Tannengrün and Weiß, the two focus ring colours from globals.css. */
const RING_COLORS = ["rgb(31, 69, 55)", "rgb(255, 255, 255)"];

type FocusState = {
  name: string;
  outline: string;
  outlineColor: string;
  focusVisible: boolean;
  /** The element (or its label) is what the browser shows at its centre. */
  unobscured: boolean;
};

const focusState = (page: Page) =>
  page.evaluate((): FocusState | null => {
    const element = document.activeElement;
    // The Next.js dev tools button exists only in development.
    if (
      !(element instanceof HTMLElement) ||
      element === document.body ||
      element.tagName === "NEXTJS-PORTAL"
    ) {
      return null;
    }
    const style = getComputedStyle(element);
    // The first line box: a link that wraps has a gap in its middle.
    const rect = element.getClientRects()[0];
    const hit = document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    const labels =
      element instanceof HTMLInputElement ? [...(element.labels ?? [])] : [];
    return {
      name:
        element.getAttribute("aria-label") ||
        element.id ||
        (element.textContent ?? ""),
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`,
      outlineColor: style.outlineColor,
      focusVisible: element.matches(":focus-visible"),
      unobscured:
        hit !== null &&
        (element.contains(hit) || labels.some((label) => label.contains(hit))),
    };
  });

/** Tabs through the whole page and returns every focus stop. */
const tabThrough = async (page: Page, key = "Tab"): Promise<FocusState[]> => {
  const stops: FocusState[] = [];
  for (let step = 0; step < 80; step++) {
    await page.keyboard.press(key);
    // Lets the 150ms colour transition of the ring finish.
    await page.waitForTimeout(250);
    const state = await focusState(page);
    if (!state) break;
    stops.push(state);
  }
  return stops;
};

for (const path of DEV_UI) {
  test.describe(path, () => {
    for (const [device, viewport] of Object.entries({ PHONE, DESKTOP })) {
      test(`has no axe violations on ${device.toLowerCase()}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });

      test(`shows a full focus ring at every Tab stop on ${device.toLowerCase()}`, async ({
        page,
      }) => {
        test.slow();
        await page.setViewportSize(viewport);
        await page.goto(path);

        for (const key of ["Tab", "Shift+Tab"]) {
          const stops = await tabThrough(page, key);
          expect(stops.length).toBeGreaterThan(20);
          for (const stop of stops) {
            expect(stop, `${key} ${stop.name}`).toMatchObject({
              outline: "solid 2px 2px",
              focusVisible: true,
              unobscured: true,
            });
            expect(RING_COLORS).toContain(stop.outlineColor);
          }
        }
      });
    }

    test("opens, cycles and closes the mobile menu by keyboard", async ({
      page,
    }) => {
      await page.setViewportSize(PHONE);
      await page.goto(path);
      await page.mouse.wheel(0, 1500);
      await page.waitForTimeout(800);
      const scrolled = await page.evaluate(() => window.scrollY);

      const button = page.locator("header button[aria-expanded]");
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("aria-expanded", "true");
      const firstLink = page
        .locator(`#${await button.getAttribute("aria-controls")} a`)
        .first();
      await expect(firstLink).toBeFocused();

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);

      // Tab stays inside the button and the menu.
      for (let step = 0; step < 12; step++) {
        await page.keyboard.press("Tab");
        const inHeader = await page.evaluate(
          () => document.activeElement?.closest("header") !== null,
        );
        expect(inHeader).toBe(true);
      }

      await page.keyboard.press("Escape");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(button).toBeFocused();
      expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    });
  });
}

for (const path of ["/", "/en", ...DEV_UI]) {
  test(`${path} is quiet: no console messages, other hosts or cookies`, async ({
    page,
    context,
  }) => {
    const messages: string[] = [];
    const otherHosts: string[] = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        messages.push(message.text());
      }
    });
    page.on("pageerror", (error) => messages.push(error.message));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith("http") && url.hostname !== "localhost") {
        otherHosts.push(request.url());
      }
    });

    await page.goto(path, { waitUntil: "networkidle" });
    const favicon = await page.request.get("/favicon.ico");

    expect(messages).toEqual([]);
    expect(otherHosts).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(favicon.status()).toBe(200);
  });
}
