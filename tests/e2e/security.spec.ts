import { expect, type Page, test } from "@playwright/test";
import { openAndScroll, watchConsole } from "./support/page-checks";

/*
 * Security and privacy, BRIEF.md section 5 "Безопасность и приватность"
 * and section 7 "Приватность": the security headers of next.config.ts on
 * pages, files, the API and the admin panel; no page sets a cookie or asks
 * another host; the Content-Security-Policy blocks nothing the site needs,
 * the 3D scene and the forms included. Plus the concept note of the demo
 * (AGENTS.md "Демо-режим") under both forms and in the footer, in both
 * languages; the Impressum's note is in contact-legal.spec.ts.
 */

const HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-frame-options": "DENY",
  "cross-origin-opener-policy": "same-origin",
  // The demo's rule, next to the security headers.
  "x-robots-tag": "noindex, nofollow",
};

/** Pages, files and the admin panel that answer with the headers above. */
const WITH_HEADERS = [
  "/",
  "/en/services/kitchens",
  "/karriere/schreiner",
  "/anfrage",
  "/gibt-es-nicht",
  "/robots.txt",
  "/de/og/site.png",
  "/api/media?limit=1",
  "/admin/login",
];

/** Every kind of page in both languages, the thank-you pages and a 404. */
const PAGES = [
  "/",
  "/en",
  "/leistungen",
  "/en/services/kitchens",
  "/referenzen",
  "/en/projects/open-plan-kitchen-in-oak",
  "/ueber-uns",
  "/en/about",
  "/karriere",
  "/karriere/schreiner",
  "/en/careers/joiner",
  "/anfrage",
  "/en/request",
  "/anfrage/danke",
  "/en/careers/thank-you",
  "/kontakt",
  "/en/contact",
  "/impressum",
  "/en/imprint",
  "/datenschutz",
  "/en/privacy",
  "/gibt-es-nicht",
];

const NOTE = {
  de: "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.",
  en: "Concept project – Schreinerei Tannrieder is a fictitious company.",
} as const;

/** The pages of both forms; the form comes first, the concept note under it. */
const FORMS = [
  { path: "/anfrage", note: NOTE.de, field: "#request-description" },
  { path: "/en/request", note: NOTE.en, field: "#request-description" },
  { path: "/karriere", note: NOTE.de, field: "#application-name" },
  { path: "/en/careers", note: NOTE.en, field: "#application-name" },
] as const;

const SECTION = 'section[aria-labelledby="szene-titel"]';

/** As in wardrobe.spec.ts: headless browsers draw WebGL in software. */
const SCENE_ARRIVES = { timeout: 20_000 };

/** The form waits at least this long before it sends, like a person. */
const MIN_FILL_TIME_MS = 3000;

type Reporter = { reportCspViolation: (line: string) => void };

/**
 * What the Content-Security-Policy blocks on the page, from the first
 * script of each document on: "directive blocked-address". Chrome also
 * writes each of them to the console, where watchConsole finds them.
 */
async function watchViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction("reportCspViolation", (line: string) => {
    violations.push(line);
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as Reporter).reportCspViolation(
        `${event.effectiveDirective} ${event.blockedURI}`,
      );
    });
  });
  return violations;
}

/** The hosts the page asks, over HTTP(S). */
function watchHosts(page: Page): Set<string> {
  const hosts = new Set<string>();
  page.on("request", (request) => {
    const { protocol, host } = new URL(request.url());
    if (protocol === "http:" || protocol === "https:") {
      hosts.add(host);
    }
  });
  return hosts;
}

test.describe("security headers", () => {
  for (const path of WITH_HEADERS) {
    test(`${path} answers with them`, async ({ request }) => {
      const response = await request.get(path);

      expect(response.headers()).toMatchObject(HEADERS);
    });
  }

  test("a photo from Payload answers with them", async ({ request }) => {
    const media = await request.get("/api/media?limit=1&depth=0");
    const { docs } = (await media.json()) as { docs: { url: string }[] };
    const response = await request.get(docs[0].url);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect(response.headers()).toMatchObject(HEADERS);
  });
});

test.describe("privacy and the Content-Security-Policy", () => {
  for (const path of PAGES) {
    test(`${path}: our domain only, no cookie, nothing blocked`, async ({
      page,
      context,
      baseURL,
    }) => {
      const violations = await watchViolations(page);
      const hosts = watchHosts(page);

      await openAndScroll(page, path);

      expect([...hosts]).toEqual([new URL(baseURL ?? "").host]);
      expect(await context.cookies()).toEqual([]);
      expect(violations).toEqual([]);
    });
  }
});

test.describe("the 3D scene under the Content-Security-Policy", () => {
  test.describe.configure({ timeout: 60_000 });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("loads, draws and goes through all steps with a clean console", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    await expect(page.locator(`${SECTION} canvas`)).toBeAttached(SCENE_ARRIVES);
    await expect(page.locator(".pin-spacer")).toBeAttached(SCENE_ARRIVES);
    // The still picture goes once the scene has drawn its wood.
    await expect(page.locator(`${SECTION} img`)).toHaveCount(0, SCENE_ARRIVES);

    const { start, length } = await page.evaluate(() => {
      const spacer = document.querySelector(".pin-spacer");
      if (!spacer) throw new Error("the panel is not pinned");
      const box = spacer.getBoundingClientRect();
      return { start: box.top + window.scrollY, length: box.height };
    });
    for (const progress of [0.25, 0.5, 0.75, 0.98]) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + progress * length,
      );
      await page.waitForTimeout(300);
    }
    await expect(
      page.locator(`${SECTION} li[aria-current="step"]`),
    ).toHaveCount(1);
    await expect(page.locator(`${SECTION} ol > li`).last()).toHaveAttribute(
      "aria-current",
      "step",
    );

    expect(violations).toEqual([]);
    expect(problems).toEqual([]);
  });
});

test.describe("the forms under the Content-Security-Policy", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the request form is sent, no cookie, a clean console", async ({
    page,
    context,
  }) => {
    const problems = watchConsole(page);
    const violations = await watchViolations(page);
    await page.goto("/anfrage");
    // Before React took over the form, a click does nothing.
    await page.waitForFunction(() => {
      const element = document.querySelector("#request-description");
      return (
        element !== null &&
        Object.keys(element).some((key) => key.startsWith("__react"))
      );
    });
    const opened = Date.now();

    await page.getByRole("radio", { name: "Küche" }).check();
    await page
      .locator("#request-description")
      .fill("Neue Küche in L-Form, Eiche geölt.");
    await page.getByRole("button", { name: "Weiter zu Schritt 2" }).click();
    await page.locator("#request-postalCode").fill("85999");
    await page.locator("#request-city").fill("Wendelfing");
    await page.locator("#request-timeframe").check();
    await page.locator("#request-budget").check();
    await page.getByRole("button", { name: "Weiter zu Schritt 3" }).click();
    await page.locator("#request-name").fill("Anna Beispiel");
    await page.locator("#request-phone").fill("089 99998 412");
    await page.locator("#request-email").fill("anna@beispiel.example");
    await page.locator("#request-contactPreference").check();
    // Like a person: the server ignores a form sent in under 3 seconds.
    await page.waitForTimeout(
      Math.max(0, MIN_FILL_TIME_MS + 500 - (Date.now() - opened)),
    );
    await page.getByRole("button", { name: "Anfrage senden" }).click();

    await expect(page).toHaveURL(/\/anfrage\/danke$/);
    await expect(page.locator("h1")).toHaveText("Danke für Ihre Anfrage");
    expect(await context.cookies()).toEqual([]);
    expect(violations).toEqual([]);
    expect(problems).toEqual([]);
  });
});

test.describe("the concept note", () => {
  for (const { path, note, field } of FORMS) {
    test(`${path} has it under the form and in the footer`, async ({
      page,
    }) => {
      await page.goto(path);

      const form = page.locator("form").filter({ has: page.locator(field) });
      const underForm = page.locator("main").getByText(note, { exact: true });
      await expect(underForm).toBeVisible();
      expect(
        await form.evaluate((element, noteText) => {
          const notes = [...document.querySelectorAll("main p")].filter(
            (p) => p.textContent === noteText,
          );
          return notes.some(
            (p) =>
              element.compareDocumentPosition(p) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }, note),
      ).toBe(true);
      await expect(
        page.locator("footer").getByText(note, { exact: true }),
      ).toBeVisible();
    });
  }
});
