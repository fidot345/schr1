import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * About us, the careers list and a job page in both languages: no console
 * messages, no axe violations, one h1, no sideways scrolling from 360 to
 * 1920 px, canonical and language alternates, the content from Payload, the
 * JobPosting markup, the language switch keeps the job, and every link to
 * these pages from the home page opens a page. BRIEF.md stage 3. Slugs and
 * counts are the seed's: ten people in the team, three open jobs.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const PAGES = [
  "/ueber-uns",
  "/en/about",
  "/karriere",
  "/en/careers",
  "/karriere/schreiner",
  "/karriere/ausbildung-schreiner",
  "/en/careers/joiner",
] as const;

const PAGE_PATH = /^(\/en)?\/(karriere|careers|ueber-uns|about)(\/[^/]+)?$/;

const ACTION_BAR = "Schnellkontakt";

/** The paths of all links on the page. */
const linkPaths = (page: Page): Promise<string[]> =>
  page.$$eval("a[href]", (links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  );

/** The JobPosting markup of the open page. */
const jobPosting = async (page: Page) => {
  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  return JSON.parse((await scripts.textContent()) ?? "null");
};

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`about and careers pages at ${name}`, () => {
    test.use({ viewport: { width, height } });

    for (const path of PAGES) {
      test(`${path} has no console errors or warnings`, async ({ page }) => {
        const problems = watchConsole(page);

        await openAndScroll(page, path);

        expect(problems).toEqual([]);
      });

      test(`${path} has one h1 and no axe violations`, async ({ page }) => {
        await openAndScroll(page, path);

        await expect(page.locator("h1")).toHaveCount(1);
        expect(await axeViolations(page)).toEqual([]);
      });
    }
  });
}

test.describe("about and careers pages from 360 to 1920 px", () => {
  for (const path of PAGES) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, `${width} px`).toBe(0);
      }
    });
  }
});

test.describe("metadata", () => {
  test("/ueber-uns has its title, canonical and both languages", async ({
    page,
  }) => {
    await page.goto("/ueber-uns");

    await expect(page).toHaveTitle("Über uns | Schreinerei Tannrieder");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/ueber-uns$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/about$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Georg Tannrieder/,
    );
  });

  test("/en/careers has its title, canonical and both languages", async ({
    page,
  }) => {
    await page.goto("/en/careers");

    await expect(page).toHaveTitle("Careers | Schreinerei Tannrieder");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/careers$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", /\/karriere$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("a job names the same job in the other language", async ({ page }) => {
    await page.goto("/en/careers/joiner");

    await expect(page).toHaveTitle("Joiner (m/f/d) | Schreinerei Tannrieder");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/careers\/joiner$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", /\/karriere\/schreiner$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /apprenticeship as a joiner/,
    );
  });
});

test.describe("the about page", () => {
  test("has the story, the mark and the team without photos", async ({
    page,
  }) => {
    await page.goto("/ueber-uns");

    await expect(page.locator("h1")).toHaveText("Familienbetrieb seit 1989");
    await expect(
      page.getByText("Georg Tannrieder hat die Werkstatt"),
    ).toBeVisible();
    await expect(
      page.getByText("Meisterbetrieb", { exact: true }),
    ).toBeVisible();

    const team = page.getByRole("region", { name: "Das Team" });
    await expect(team.locator("dt")).toHaveCount(10);
    await expect(team.locator("dt").first()).toHaveText("Johannes Tannrieder");
    await expect(
      team.getByText("Schreinermeister, Inhaber", { exact: true }),
    ).toBeVisible();
    await expect(team.getByText("seit 2003", { exact: true })).toBeVisible();
    await expect(page.locator("main img")).toHaveCount(0);
  });

  test("is in English on /en/about", async ({ page }) => {
    await page.goto("/en/about");

    await expect(page.locator("h1")).toHaveText("Family business since 1989");
    const team = page.getByRole("region", { name: "The team" });
    await expect(team.locator("dt")).toHaveCount(10);
    await expect(
      team.getByText("Master joiner, owner", { exact: true }),
    ).toBeVisible();
    await expect(team.getByText("since 2003", { exact: true })).toBeVisible();
  });

  test("leads on to the open positions", async ({ page }) => {
    await page.goto("/ueber-uns");

    await page
      .getByRole("region", { name: "Erzählen Sie uns von Ihrem Projekt" })
      .getByRole("link", { name: "Offene Stellen ansehen" })
      .click();
    await expect(page).toHaveURL(/\/karriere$/);
  });
});

test.describe("the careers page", () => {
  test("lists the open jobs with type, start and pay", async ({ page }) => {
    await page.goto("/karriere");

    await expect(page.locator("h1")).toHaveText("Karriere");
    const jobs = page.getByRole("region", { name: "Offene Stellen" });
    await expect(jobs.getByRole("link")).toHaveCount(3);
    await expect(
      jobs.getByRole("link", { name: /Schreiner \(m\/w\/d\)/ }).first(),
    ).toHaveAttribute("href", "/karriere/schreiner");
    await expect(
      jobs.getByText("Vollzeit, ab sofort, 19–23 € pro Stunde"),
    ).toBeVisible();
    await expect(
      jobs.getByText(
        "Ausbildung, September 2027, 1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
      ),
    ).toBeVisible();
  });

  test("has the trial day with a call button and no form yet", async ({
    page,
  }) => {
    await page.goto("/karriere");

    const trial = page.getByRole("region", {
      name: "Schnuppertag für Schüler:innen",
    });
    await expect(
      trial.getByRole("link", { name: "Jetzt anrufen" }),
    ).toHaveAttribute("href", "tel:+498999998412");
    await expect(page.locator("main form")).toHaveCount(0);
  });

  test("is in English on /en/careers", async ({ page }) => {
    await page.goto("/en/careers");

    const jobs = page.getByRole("region", { name: "Open positions" });
    await expect(jobs.getByRole("link")).toHaveCount(3);
    await expect(
      jobs.getByRole("link", { name: /Joiner \(m\/f\/d\)/ }).first(),
    ).toHaveAttribute("href", "/en/careers/joiner");
    await expect(
      jobs.getByText("Full-time, immediately, €19–23 per hour"),
    ).toBeVisible();
    await expect(
      jobs.getByText(
        "Apprenticeship, September 2027, 1st year €900, 2nd year €1,000, 3rd year €1,100 per month",
      ),
    ).toBeVisible();
  });
});

test.describe("a job page", () => {
  test("has the facts, the lists and the way to apply", async ({ page }) => {
    await page.goto("/karriere/schreiner");

    await expect(page.locator("h1")).toHaveText("Schreiner (m/w/d)");
    for (const [label, value] of [
      ["Art der Stelle", "Vollzeit"],
      ["Start", "ab sofort"],
      ["Arbeitszeit", "Mo–Do 7:00–16:30, Fr 7:00–12:00"],
      ["Lohn", "19–23 € pro Stunde"],
    ]) {
      const term = page.getByRole("term").filter({ hasText: label });
      await expect(term).toHaveCount(1);
      await expect(term.locator("xpath=following-sibling::dd")).toHaveText(
        value,
      );
    }

    const details = page.getByRole("region", { name: "Das erwartet dich" });
    for (const heading of [
      "Deine Aufgaben",
      "Was du mitbringst",
      "Was wir bieten",
    ]) {
      await expect(
        details.getByRole("heading", { name: heading }),
      ).toBeVisible();
    }
    await expect(details.getByRole("listitem")).toHaveCount(12);

    const apply = page.getByRole("region", { name: "Bewirb dich" });
    await expect(
      apply.getByRole("link", { name: "Jetzt anrufen" }),
    ).toHaveAttribute("href", "tel:+498999998412");
    await expect(
      apply.getByRole("link", { name: "Alle offenen Stellen ansehen" }),
    ).toHaveAttribute("href", "/karriere");
    await expect(page.locator("main form")).toHaveCount(0);
  });

  test("shows the text of an apprenticeship as its pay", async ({ page }) => {
    await page.goto("/karriere/ausbildung-schreiner");

    await expect(
      page
        .getByRole("term")
        .filter({ hasText: "Lohn" })
        .locator("xpath=following-sibling::dd"),
    ).toHaveText("1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat");
    await expect(
      page
        .getByRole("term")
        .filter({ hasText: "Art der Stelle" })
        .locator("xpath=following-sibling::dd"),
    ).toHaveText("Ausbildung");
  });

  test("is in English on /en/careers/joiner", async ({ page }) => {
    await page.goto("/en/careers/joiner");

    await expect(page.locator("h1")).toHaveText("Joiner (m/f/d)");
    await expect(
      page
        .getByRole("term")
        .filter({ hasText: "Pay" })
        .locator("xpath=following-sibling::dd"),
    ).toHaveText("€19–23 per hour");
    await expect(
      page.getByRole("region", { name: "What to expect" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Apply" })
        .getByRole("link", { name: "Call now" }),
    ).toHaveAttribute("href", "tel:+498999998412");
  });
});

test.describe("the JobPosting markup", () => {
  test("of a job with a pay range", async ({ page }) => {
    await page.goto("/karriere/schreiner");
    const posting = await jobPosting(page);

    expect(posting).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Schreiner (m/w/d)",
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: "Schreinerei Tannrieder",
      },
      jobLocation: {
        address: {
          streetAddress: "Werkstattweg 4",
          addressLocality: "Wendelfing",
          addressCountry: "DE",
        },
      },
      baseSalary: {
        currency: "EUR",
        value: { minValue: 19, maxValue: 23, unitText: "HOUR" },
      },
    });
    expect(posting.datePosted).toMatch(/^2026-11-02/);
    expect(posting.description).toContain(
      "<li>Moderne Maschinen in der Werkstatt</li>",
    );
  });

  test("of an apprenticeship, with no figures for the pay", async ({
    page,
  }) => {
    await page.goto("/karriere/ausbildung-schreiner");
    const posting = await jobPosting(page);

    expect(posting).toMatchObject({
      "@type": "JobPosting",
      employmentType: "OTHER",
    });
    expect(posting).not.toHaveProperty("baseSalary");
  });

  test("in English on the English page", async ({ page }) => {
    await page.goto("/en/careers/joiner");
    const posting = await jobPosting(page);

    expect(posting.title).toBe("Joiner (m/f/d)");
    expect(posting.description).toContain("<strong>Your tasks</strong>");
  });

  test("is only on job pages", async ({ page }) => {
    for (const path of ["/karriere", "/ueber-uns"]) {
      await page.goto(path);
      await expect(
        page.locator('script[type="application/ld+json"]'),
      ).toHaveCount(0);
    }
  });
});

test.describe("language switch at 1440 px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("goes to the same job with the other slug", async ({ page }) => {
    await page.goto("/karriere/schreiner");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en\/careers\/joiner$/);

    await page.getByRole("link", { name: "DE – Deutsch" }).click();
    await expect(page).toHaveURL(/\/karriere\/schreiner$/);
  });

  test("keeps the apprenticeship and the other two pages", async ({ page }) => {
    await page.goto("/en/careers/apprenticeship-joiner");
    await page.getByRole("link", { name: "DE – Deutsch" }).click();
    await expect(page).toHaveURL(/\/karriere\/ausbildung-schreiner$/);

    await page.goto("/karriere");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en\/careers$/);

    await page.goto("/ueber-uns");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
  });
});

test.describe("the mobile bar at 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("is on the about page, not on the careers pages", async ({ page }) => {
    await page.goto("/ueber-uns");
    await expect(
      page.getByRole("navigation", { name: ACTION_BAR }),
    ).toHaveCount(1);

    for (const path of [
      "/karriere",
      "/karriere/schreiner",
      "/en/careers/joiner",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: ACTION_BAR }),
      ).toHaveCount(0);
    }
  });
});

test.describe("links to these pages", () => {
  for (const path of ["/", "/en", "/ueber-uns", "/en/careers"] as const) {
    test(`every link to them on ${path} opens a page`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const targets = [
        ...new Set(
          (await linkPaths(page)).filter((link) => PAGE_PATH.test(link)),
        ),
      ];
      expect(targets.length).toBeGreaterThanOrEqual(2);

      for (const target of targets) {
        const response = await request.get(target);
        expect(response.status(), target).toBe(200);
      }
    });
  }

  test("the home page reaches all three jobs", async ({ page }) => {
    await page.goto("/");

    const targets = new Set(await linkPaths(page));
    for (const slug of ["schreiner", "monteur", "ausbildung-schreiner"]) {
      expect(targets.has(`/karriere/${slug}`), slug).toBe(true);
    }
  });

  test("an unknown job is a 404", async ({ request }) => {
    expect((await request.get("/karriere/gibt-es-nicht")).status()).toBe(404);
    expect((await request.get("/en/careers/does-not-exist")).status()).toBe(
      404,
    );
    // A job under the other language's slug does not exist either.
    expect((await request.get("/en/careers/schreiner")).status()).toBe(404);
  });
});
