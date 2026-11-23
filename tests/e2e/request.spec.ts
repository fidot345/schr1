import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * The request form and its thank-you page in both languages, BRIEF.md
 * stage 4: no console messages, no axe violations (also with errors shown),
 * filled in with the keyboard alone, errors under the fields and in a list
 * on top with the focus on the first one, the trap field, ?typ= and the
 * request button of a service page. The e2e server runs with
 * MAIL_TRANSPORT=log, so no mail goes out.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const PAGES = [
  "/anfrage",
  "/en/request",
  "/anfrage/danke",
  "/en/request/thank-you",
] as const;

/** The form waits at least this long before it sends, like a person. */
const MIN_FILL_TIME_MS = 3000;

const TEXTS = {
  de: {
    path: "/anfrage",
    thanks: /\/anfrage\/danke$/,
    thanksTitle: "Danke für Ihre Anfrage",
    next2: "Weiter zu Schritt 2",
    next3: "Weiter zu Schritt 3",
    back: "Zurück",
    send: "Anfrage senden",
    typeError: "Bitte wählen Sie aus, was wir für Sie bauen sollen.",
    descriptionError:
      "Bitte beschreiben Sie Ihr Vorhaben in mindestens 20 Zeichen.",
    postalCodeError: "Bitte geben Sie eine fünfstellige Postleitzahl ein.",
    contactError:
      "Bitte geben Sie eine Telefonnummer oder eine E-Mail-Adresse an, damit wir Sie erreichen.",
    kitchen: "Küche",
    wardrobe: "Schrank oder Möbel nach Maß",
    description: "Beschreiben Sie kurz Ihr Vorhaben",
    postalCode: "Postleitzahl",
  },
  en: {
    path: "/en/request",
    thanks: /\/en\/request\/thank-you$/,
    thanksTitle: "Thank you for your request",
    next2: "Continue to step 2",
    next3: "Continue to step 3",
    back: "Back",
    send: "Send request",
    typeError: "Please choose what you would like us to build.",
    descriptionError: "Please describe your project in at least 20 characters.",
    postalCodeError: "Please enter a five-digit German postcode.",
    contactError:
      "Please enter a phone number or an email address so we can reach you.",
    kitchen: "Kitchen",
    wardrobe: "Wardrobe or made-to-measure furniture",
    description: "Briefly describe your project",
    postalCode: "Postcode",
  },
} as const;

type Language = keyof typeof TEXTS;

const form = (page: Page) =>
  page.locator("form").filter({
    has: page.locator("#request-description"),
  });

/** Waits until React took over the form: before that, a click does nothing. */
async function openForm(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => {
    const element = document.querySelector("#request-description");
    return (
      element !== null &&
      Object.keys(element).some((key) => key.startsWith("__react"))
    );
  });
}

/** Tab to the next field, then type into it. */
async function tabAndType(page: Page, text: string) {
  await page.keyboard.press("Tab");
  await page.keyboard.type(text);
}

/**
 * The whole request with the keyboard alone, from the first radio button:
 * arrows choose a card, Space picks the first card of a group, Tab moves on,
 * Enter in a field or on the button goes to the next step.
 */
async function fillWithKeyboard(page: Page, language: Language) {
  const texts = TEXTS[language];

  // Step 1: the kind of work, the description, the dimensions; Enter sends.
  await page.locator("#request-projectType").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: texts.wardrobe })).toBeChecked();
  await tabAndType(page, "Einbauschrank fürs Schlafzimmer, 3,20 m breit.");
  await tabAndType(page, "320 × 250 × 60 cm");
  await page.keyboard.press("Enter");

  // Step 2: the focus is on the step's heading.
  await expect(page.locator("#request-step-2")).toBeFocused();
  await tabAndType(page, "85999");
  await tabAndType(page, "Wendelfing");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: texts.next3 })).toBeFocused();
  await page.keyboard.press("Enter");

  // Step 3: name, phone, e-mail, how to reach them.
  await expect(page.locator("#request-step-3")).toBeFocused();
  await tabAndType(page, "Anna Beispiel");
  await tabAndType(page, "089 99998 412");
  await tabAndType(page, "anna@beispiel.example");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: texts.send })).toBeFocused();
}

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`request pages at ${name}`, () => {
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

    test("the form has no axe violations with errors and on every step", async ({
      page,
    }) => {
      await openForm(page, "/anfrage");
      await page.getByRole("button", { name: "Weiter zu Schritt 2" }).click();
      await expect(form(page).getByRole("alert")).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);

      await page.getByRole("radio", { name: "Küche" }).check();
      await page
        .getByLabel("Beschreiben Sie kurz Ihr Vorhaben")
        .fill("Neue Küche in L-Form, Eiche geölt.");
      await page.getByRole("button", { name: "Weiter zu Schritt 2" }).click();
      await page.getByRole("button", { name: "Weiter zu Schritt 3" }).click();
      await expect(form(page).getByRole("alert")).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });

    test("the mobile bar is not on the form", async ({ page }) => {
      await page.goto("/anfrage");

      await expect(
        page.getByRole("navigation", { name: "Schnellkontakt" }),
      ).toHaveCount(0);
    });
  });
}

test.describe("request pages from 360 to 1920 px", () => {
  for (const path of ["/anfrage", "/anfrage/danke"] as const) {
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

test.describe("request metadata", () => {
  test("the form has its title, canonical and both languages", async ({
    page,
  }) => {
    await page.goto("/anfrage");

    await expect(page).toHaveTitle("Projekt anfragen | Schreinerei Tannrieder");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/anfrage$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/request$/);
  });

  for (const path of ["/anfrage/danke", "/en/request/thank-you"] as const) {
    test(`${path} is noindex`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }
});

for (const language of ["de", "en"] as const) {
  const texts = TEXTS[language];

  test.describe(`request form in ${language}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("is sent with the keyboard alone and ends on the thank-you page", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await openForm(page, texts.path);
      const opened = Date.now();

      await fillWithKeyboard(page, language);
      // Like a person: the server ignores a form sent in under 3 seconds.
      await page.waitForTimeout(
        Math.max(0, MIN_FILL_TIME_MS + 500 - (Date.now() - opened)),
      );
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(texts.thanks);
      await expect(page.locator("h1")).toHaveText(texts.thanksTitle);
      expect(problems).toEqual([]);
    });

    test("shows the errors under the fields and on top, focus on the first", async ({
      page,
    }) => {
      await openForm(page, texts.path);
      await page.getByRole("button", { name: texts.next2 }).click();

      const summary = form(page).getByRole("alert");
      await expect(summary.getByRole("link")).toHaveText([
        texts.typeError,
        texts.descriptionError,
      ]);
      await expect(page.locator("#request-projectType")).toBeFocused();
      await expect(page.locator("#request-projectType-error")).toContainText(
        texts.typeError,
      );
      await expect(page.locator("#request-description")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(page.locator("#request-description-error")).toContainText(
        texts.descriptionError,
      );

      // A link in the list moves the focus into its field.
      await summary.getByRole("link", { name: texts.descriptionError }).click();
      await expect(page.locator("#request-description")).toBeFocused();

      // The error follows the typing once it is shown.
      await page.keyboard.type("Neue Küche in L-Form, Eiche geölt.");
      await expect(page.locator("#request-description-error")).toHaveCount(0);
      await expect(summary.getByRole("link")).toHaveText([texts.typeError]);
    });

    test("a click on the button right after typing is not lost", async ({
      page,
    }) => {
      // An error shown on leaving the field would push the button down
      // between mouse down and up, and the click would miss it.
      await openForm(page, texts.path);
      await page.getByLabel(texts.description).fill("Kurz");
      await page.getByRole("button", { name: texts.next2 }).click();

      await expect(form(page).getByRole("alert")).toBeVisible();
      await expect(page.locator("#request-projectType")).toBeFocused();
    });

    test("checks step 2 and keeps the values on the way back", async ({
      page,
    }) => {
      await openForm(page, texts.path);
      await page.getByRole("radio", { name: texts.kitchen }).check();
      await page
        .getByLabel(texts.description)
        .fill("Neue Küche in L-Form, Eiche geölt.");
      await page.getByRole("button", { name: texts.next2 }).click();

      await page.getByLabel(texts.postalCode).fill("8599");
      await page.getByRole("button", { name: texts.next3 }).click();
      await expect(page.locator("#request-postalCode")).toBeFocused();
      await expect(page.locator("#request-postalCode-error")).toContainText(
        texts.postalCodeError,
      );

      await page.getByRole("button", { name: texts.back }).click();
      await expect(page.locator("#request-step-1")).toBeFocused();
      await expect(
        page.getByRole("radio", { name: texts.kitchen }),
      ).toBeChecked();
      await expect(page.getByLabel(texts.description)).toHaveValue(
        "Neue Küche in L-Form, Eiche geölt.",
      );
      await expect(form(page).getByRole("alert")).toHaveCount(0);
    });

    test("wants a phone number or an e-mail address", async ({ page }) => {
      await openForm(page, texts.path);
      await page.getByRole("radio", { name: texts.kitchen }).check();
      await page
        .getByLabel(texts.description)
        .fill("Neue Küche in L-Form, Eiche geölt.");
      await page.getByRole("button", { name: texts.next2 }).click();
      await page.getByLabel(texts.postalCode).fill("85999");
      await page.locator("#request-city").fill("Wendelfing");
      await page.locator("#request-timeframe").check();
      await page.locator("#request-budget").check();
      await page.getByRole("button", { name: texts.next3 }).click();

      await page.locator("#request-name").fill("Anna Beispiel");
      await page.locator("#request-contactPreference").check();
      await page.getByRole("button", { name: texts.send }).click();

      await expect(page.locator("#request-phone")).toBeFocused();
      await expect(page.locator("#request-phone-error")).toContainText(
        texts.contactError,
      );
      await expect(page).toHaveURL(new RegExp(`${texts.path}$`));
    });
  });
}

test.describe("request trap and ?typ=", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a filled trap field still ends on the thank-you page", async ({
    page,
  }) => {
    await openForm(page, "/anfrage");
    // People never reach it: it is out of sight and out of the tab order.
    await expect(page.locator("#request-trap")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await page.locator("#request-trap").fill("https://spam.example", {
      force: true,
    });
    const opened = Date.now();

    await fillWithKeyboard(page, "de");
    await page.waitForTimeout(
      Math.max(0, MIN_FILL_TIME_MS + 500 - (Date.now() - opened)),
    );
    await page.keyboard.press("Enter");

    // The bot learns nothing; the server sends no mail (Vitest checks that).
    await expect(page).toHaveURL(TEXTS.de.thanks);
  });

  test("?typ=kueche chooses the kitchen", async ({ page }) => {
    await openForm(page, "/anfrage?typ=kueche");

    await expect(page.getByRole("radio", { name: "Küche" })).toBeChecked();
  });

  test("?typ= works in English and ignores unknown values", async ({
    page,
  }) => {
    await openForm(page, "/en/request?typ=schrank");
    await expect(
      page.getByRole("radio", { name: TEXTS.en.wardrobe }),
    ).toBeChecked();

    await openForm(page, "/anfrage?typ=garage");
    await expect(form(page).getByRole("radio", { checked: true })).toHaveCount(
      0,
    );
  });

  test("the request button of a service opens the form with its kind", async ({
    page,
  }) => {
    await page.goto("/leistungen/kuechen");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Projekt anfragen" })
      .first()
      .click();

    await expect(page).toHaveURL(/\/anfrage\?typ=kueche$/);
    await expect(page.getByRole("radio", { name: "Küche" })).toBeChecked();
  });

  test("the English service opens the English form with its kind", async ({
    page,
  }) => {
    await page.goto("/en/services/cabinets-and-furniture");
    await page
      .getByRole("main")
      .getByRole("link", { name: /request/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/en\/request\?typ=schrank$/);
    await expect(
      page.getByRole("radio", { name: TEXTS.en.wardrobe }),
    ).toBeChecked();
  });
});
