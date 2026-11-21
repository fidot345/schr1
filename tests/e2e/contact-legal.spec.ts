import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * Contact, Impressum, Datenschutz and the 404 in both languages: no console
 * messages, no axe violations, one h1, no sideways scrolling from 360 to
 * 1920 px, canonical and language alternates, the content from SiteSettings
 * in Payload, the language switch, no cookies, and the header and footer
 * lead to pages that exist. BRIEF.md stage 3. Texts are the seed's.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const PAGES = [
  "/kontakt",
  "/en/contact",
  "/impressum",
  "/en/imprint",
  "/datenschutz",
  "/en/privacy",
] as const;

const MISSING = [
  "/gibt-es-nicht",
  "/en/nothing-here",
  "/leistungen/gibt-es-nicht",
] as const;

const ACTION_BAR = "Schnellkontakt";

/** The paths of all links in this part of the page. */
const linkPaths = (page: Page, selector: string): Promise<string[]> =>
  page.$$eval(`${selector} a[href]`, (links) =>
    links
      .map((link) => new URL((link as HTMLAnchorElement).href))
      .filter((url) => url.origin === window.location.origin)
      .map((url) => url.pathname),
  );

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`contact and legal pages at ${name}`, () => {
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

    for (const path of MISSING) {
      test(`the 404 of ${path} has no other console messages`, async ({
        page,
      }) => {
        const problems = watchConsole(page);

        await openAndScroll(page, path);

        // The browser reports the 404 of the page itself; nothing else.
        expect(problems).toEqual([
          "error: Failed to load resource: the server responded with a status of 404 (Not Found)",
        ]);
      });

      test(`the 404 of ${path} has one h1 and no axe violations`, async ({
        page,
      }) => {
        await openAndScroll(page, path);

        await expect(page.locator("h1")).toHaveCount(1);
        expect(await axeViolations(page)).toEqual([]);
      });
    }
  });
}

test.describe("contact and legal pages from 360 to 1920 px", () => {
  for (const path of [...PAGES, MISSING[0]]) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
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
  for (const [path, title, canonical, other, otherHref, description] of [
    [
      "/kontakt",
      "Kontakt | Schreinerei Tannrieder",
      /\/kontakt$/,
      "en",
      /\/en\/contact$/,
      /089 99998 412/,
    ],
    [
      "/en/contact",
      "Contact | Schreinerei Tannrieder",
      /\/en\/contact$/,
      "de",
      /\/kontakt$/,
      /info@tannrieder\.example/,
    ],
    [
      "/impressum",
      "Impressum | Schreinerei Tannrieder",
      /\/impressum$/,
      "en",
      /\/en\/imprint$/,
      /Portfolio-Projekt/,
    ],
    [
      "/en/imprint",
      "Imprint | Schreinerei Tannrieder",
      /\/en\/imprint$/,
      "de",
      /\/impressum$/,
      /portfolio project/,
    ],
    [
      "/datenschutz",
      "Datenschutzerklärung | Schreinerei Tannrieder",
      /\/datenschutz$/,
      "en",
      /\/en\/privacy$/,
      /keine Cookies/,
    ],
    [
      "/en/privacy",
      "Privacy policy | Schreinerei Tannrieder",
      /\/en\/privacy$/,
      "de",
      /\/datenschutz$/,
      /no cookies/,
    ],
  ] as const) {
    test(`${path} has its title, canonical and both languages`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        canonical,
      );
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${other}"]`),
      ).toHaveAttribute("href", otherHref);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        description,
      );
    });
  }
});

test.describe("the contact page", () => {
  test("has phone, e-mail, address, hours, area and the request", async ({
    page,
  }) => {
    await page.goto("/kontakt");

    await expect(page.locator("h1")).toHaveText("Kontakt");
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: "089 99998 412" }),
    ).toHaveAttribute("href", "tel:+498999998412");
    await expect(
      main.getByRole("link", { name: "info@tannrieder.example" }),
    ).toHaveAttribute("href", "mailto:info@tannrieder.example");
    await expect(main.locator("address")).toHaveText(
      /Werkstattweg 4\s*85999 Wendelfing/,
    );

    await expect(
      main.getByRole("heading", { name: "Öffnungszeiten" }),
    ).toBeVisible();
    for (const [days, hours] of [
      ["Mo–Do", "7:00–16:30 Uhr"],
      ["Fr", "7:00–12:00 Uhr"],
    ]) {
      await expect(
        main
          .getByRole("term")
          .filter({ hasText: days })
          .locator("xpath=following-sibling::dd[1]"),
      ).toHaveText(hours);
    }
    await expect(
      main.getByRole("heading", { name: "Wo wir arbeiten" }),
    ).toBeVisible();
    await expect(main.getByText("Umkreis von etwa 40 km")).toBeVisible();
    await expect(
      main.getByRole("link", { name: "Projekt anfragen" }),
    ).toHaveAttribute("href", "/anfrage");
  });

  test("has no map and no form", async ({ page }) => {
    await page.goto("/kontakt");

    await expect(page.locator("main iframe")).toHaveCount(0);
    await expect(page.locator("main form")).toHaveCount(0);
    await expect(page.locator("main img")).toHaveCount(0);
  });

  test("is in English on /en/contact", async ({ page }) => {
    await page.goto("/en/contact");

    await expect(page.locator("h1")).toHaveText("Contact");
    const main = page.locator("main");
    await expect(
      main
        .getByRole("term")
        .filter({ hasText: "Mon–Thu" })
        .locator("xpath=following-sibling::dd[1]"),
    ).toHaveText("7:00–16:30");
    await expect(main.getByText("within about 40 km")).toBeVisible();
    await expect(
      main.getByRole("link", { name: "Request a project" }),
    ).toHaveAttribute("href", "/en/request");
  });

  test("has no mobile action bar at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kontakt");
    await expect(
      page.getByRole("navigation", { name: ACTION_BAR }),
    ).toHaveCount(0);

    await page.goto("/impressum");
    await expect(
      page.getByRole("navigation", { name: ACTION_BAR }),
    ).toHaveCount(1);
  });
});

test.describe("the imprint", () => {
  test("starts with the concept note, then the text from Payload", async ({
    page,
  }) => {
    await page.goto("/impressum");

    await expect(page.locator("h1")).toHaveText("Impressum");
    const note = page
      .locator("main")
      .getByText(
        "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.",
        { exact: true },
      );
    await expect(note).toBeVisible();
    const headings = page.locator("main h2");
    await expect(headings).toHaveText([
      "Konzeptprojekt",
      "Angaben zur Firma (Beispiel)",
    ]);
    // The note comes before the first heading of the text.
    const noteBox = await note.boundingBox();
    const headingBox = await headings.first().boundingBox();
    expect(noteBox?.y).toBeLessThan(headingBox?.y ?? 0);

    await expect(
      page.getByText("Werkstattweg 4, 85999 Wendelfing", { exact: true }),
    ).toBeVisible();
  });

  test("has no register or tax number", async ({ page }) => {
    await page.goto("/impressum");
    const text = ((await page.locator("main").textContent()) ?? "").replace(
      /\s+/g,
      " ",
    );

    expect(text).not.toMatch(/\bHR[AB]\s*\d/);
    expect(text).not.toMatch(/\bDE\s?\d{9}\b/);
    expect(text).not.toMatch(/\b\d{2,3}\/\d{3}\/\d{4,5}\b/);
    expect(text).not.toMatch(/(Steuernummer|USt-IdNr\.?|Registernummer):/);
  });

  test("is in English on /en/imprint", async ({ page }) => {
    await page.goto("/en/imprint");

    await expect(page.locator("h1")).toHaveText("Imprint");
    await expect(
      page
        .locator("main")
        .getByText(
          "Concept project – Schreinerei Tannrieder is a fictitious company.",
          { exact: true },
        ),
    ).toBeVisible();
    await expect(page.locator("main h2").first()).toHaveText("Concept project");
  });
});

test.describe("the privacy policy", () => {
  test("describes hosting, the forms and that there are no cookies", async ({
    page,
  }) => {
    await page.goto("/datenschutz");

    await expect(page.locator("h1")).toHaveText("Datenschutzerklärung");
    await expect(page.locator("main h2")).toHaveText([
      "Kurz gesagt",
      "Hosting",
      "Formulare",
      "Ihre Rechte",
    ]);
    await expect(page.getByText(/setzt keine Cookies/)).toBeVisible();
    await expect(page.getByText(/Vercel Inc\./)).toBeVisible();
    await expect(page.getByText(/über den E-Mail-Dienst Resend/)).toBeVisible();
  });

  test("is in English on /en/privacy", async ({ page }) => {
    await page.goto("/en/privacy");

    await expect(page.locator("h1")).toHaveText("Privacy policy");
    await expect(page.locator("main h2").first()).toHaveText("In short");
  });

  test("tells the truth: none of these pages sets a cookie", async ({
    page,
    context,
  }) => {
    for (const path of [...PAGES, MISSING[0]]) {
      await page.goto(path);
    }
    expect(await context.cookies()).toEqual([]);
  });
});

test.describe("the 404", () => {
  test("answers unknown addresses with 404 in both languages", async ({
    request,
  }) => {
    for (const path of [
      ...MISSING,
      "/en/services/does-not-exist",
      "/ueber-uns/gibt-es-nicht",
    ]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  test("is in German, with the ways on", async ({ page }) => {
    await page.goto("/gibt-es-nicht");

    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page).toHaveTitle(
      "Seite nicht gefunden | Schreinerei Tannrieder",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator("h1")).toHaveText("Seite nicht gefunden");
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: "Zur Startseite" }),
    ).toHaveAttribute("href", "/");
    await expect(
      main.getByRole("link", { name: "Unsere Leistungen" }),
    ).toHaveAttribute("href", "/leistungen");
    await expect(
      main.getByRole("link", { name: "Kontakt aufnehmen" }),
    ).toHaveAttribute("href", "/kontakt");
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
  });

  test("is in English under /en", async ({ page }) => {
    await page.goto("/en/nothing-here");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Page not found | Schreinerei Tannrieder");
    await expect(page.locator("h1")).toHaveText("Page not found");
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: "Go to the home page" }),
    ).toHaveAttribute("href", "/en");
    await expect(
      main.getByRole("link", { name: "Our services" }),
    ).toHaveAttribute("href", "/en/services");
    await expect(
      main.getByRole("link", { name: "Get in touch" }),
    ).toHaveAttribute("href", "/en/contact");
  });

  test("is the same for an unknown service", async ({ page }) => {
    await page.goto("/leistungen/gibt-es-nicht");

    await expect(page).toHaveTitle(
      "Seite nicht gefunden | Schreinerei Tannrieder",
    );
    await expect(page.locator("h1")).toHaveText("Seite nicht gefunden");
  });

  test("leads on to pages that exist", async ({ page, request }) => {
    for (const path of ["/gibt-es-nicht", "/en/nothing-here"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      for (const target of await linkPaths(page, "main")) {
        expect((await request.get(target)).status(), target).toBe(200);
      }
    }
  });
});

test.describe("language switch at 1440 px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const [de, en] of [
    ["/kontakt", "/en/contact"],
    ["/impressum", "/en/imprint"],
    ["/datenschutz", "/en/privacy"],
  ] as const) {
    test(`${de} and ${en} switch to each other`, async ({ page }) => {
      await page.goto(de);
      await page.getByRole("link", { name: "EN – English" }).click();
      await expect(page).toHaveURL(new RegExp(`${en}$`));

      await page.getByRole("link", { name: "DE – Deutsch" }).click();
      await expect(page).toHaveURL(new RegExp(`${de}$`));
    });
  }

  test("goes to the other language's home page from a 404", async ({
    page,
  }) => {
    await page.goto("/gibt-es-nicht");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en$/);

    await page.goto("/en/nothing-here");
    await page.getByRole("link", { name: "DE – Deutsch" }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
  });
});

test.describe("header and footer", () => {
  for (const path of ["/", "/en", "/kontakt", "/en/privacy"] as const) {
    test(`lead to pages that exist on ${path}`, async ({ page, request }) => {
      await page.goto(path);
      const targets = [
        ...new Set([
          ...(await linkPaths(page, "header")),
          ...(await linkPaths(page, "footer")),
        ]),
      ].filter((target) => !/^(\/en)?\/(anfrage|request)$/.test(target));
      expect(targets.length).toBeGreaterThanOrEqual(8);

      for (const target of targets) {
        // The switch on an English page links to /de/…, which redirects.
        const response = await request.get(target);
        expect(response.status(), target).toBe(200);
      }
    });
  }

  test("the footer links Impressum and Datenschutz in both languages", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(
      footer.getByRole("link", { name: "Impressum" }),
    ).toHaveAttribute("href", "/impressum");
    await expect(
      footer.getByRole("link", { name: "Datenschutz" }),
    ).toHaveAttribute("href", "/datenschutz");
    await expect(
      footer.getByRole("link", { name: "Kontakt", exact: true }),
    ).toHaveAttribute("href", "/kontakt");

    await page.goto("/en");
    await expect(footer.getByRole("link", { name: "Imprint" })).toHaveAttribute(
      "href",
      "/en/imprint",
    );
    await expect(
      footer.getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/en/privacy");
    await expect(
      footer.getByRole("link", { name: "Contact", exact: true }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
