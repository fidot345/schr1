import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * The application form and its thank-you page in both languages, BRIEF.md
 * stage 4: no console messages, no axe violations (also with errors shown),
 * filled in with the keyboard alone, errors under the fields and in a list
 * on top with the focus on the first one, the trap field, the job chosen on
 * a job page and the trial day's buttons. The dev server runs with
 * MAIL_TRANSPORT=log, so no mail goes out. Jobs are the seed's.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const THANKS_PAGES = ["/karriere/danke", "/en/careers/thank-you"] as const;

/** The form waits at least this long before it sends, like a person. */
const MIN_FILL_TIME_MS = 3000;

const TEXTS = {
  de: {
    path: "/karriere",
    thanks: /\/karriere\/danke$/,
    thanksTitle: "Danke für deine Bewerbung",
    send: "Bewerbung abschicken",
    summaryTitle: "Bitte prüf deine Angaben",
    firstJob: "Schreiner (m/w/d)",
    trialDay: "Schnuppertag / Praktikum",
    afternoon: "Nachmittags",
    errors: [
      "Bitte wähl aus, wofür du dich bewirbst.",
      "Bitte gib deinen Namen ein.",
      "Bitte gib deine Telefonnummer ein, damit wir dich anrufen können.",
      "Bitte wähl aus, was du mitbringst.",
      "Bitte gib an, ab wann du anfangen kannst.",
      "Bitte wähl aus, wann wir dich am besten anrufen.",
    ],
    phoneInvalid:
      "Bitte gib eine Telefonnummer mit Vorwahl ein, nur mit Ziffern, Leerzeichen und + / ( ) -.",
    messageLong: "Bitte fass dich in höchstens 500 Zeichen.",
  },
  en: {
    path: "/en/careers",
    thanks: /\/en\/careers\/thank-you$/,
    thanksTitle: "Thank you for your application",
    send: "Send application",
    summaryTitle: "Please check your details",
    firstJob: "Joiner (m/f/d)",
    trialDay: "Taster day / internship",
    afternoon: "Afternoons",
    errors: [
      "Please choose what you are applying for.",
      "Please enter your name.",
      "Please enter your phone number so we can call you.",
      "Please choose what you bring.",
      "Please tell us when you can start.",
      "Please choose when is the best time to call you.",
    ],
    phoneInvalid:
      "Please enter a phone number with area code, using only digits, spaces and + / ( ) -.",
    messageLong: "Please keep your message to no more than 500 characters.",
  },
} as const;

type Language = keyof typeof TEXTS;

const form = (page: Page) =>
  page.locator("form").filter({ has: page.locator("#application-name") });

/** Waits until React took over the form: before that, a click does nothing. */
async function openForm(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => {
    const element = document.querySelector("#application-name");
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
 * The whole application with the keyboard alone, from the job the form
 * starts with (none chosen: the first card): Space picks the first card of
 * a group, arrows move to another, Tab goes on. Ends on the send button.
 */
async function fillWithKeyboard(page: Page, language: Language) {
  const texts = TEXTS[language];

  await page.locator("#application-job").focus();
  await page.keyboard.press("Space");
  await expect(
    form(page).getByRole("radio", { name: texts.firstJob, exact: true }),
  ).toBeChecked();
  await tabAndType(page, "Lukas Beispiel");
  await tabAndType(page, "0171 2345678");
  await tabAndType(page, "lukas@beispiel.example");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await tabAndType(page, "ab sofort");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: texts.afternoon }),
  ).toBeChecked();
  await tabAndType(page, "Ich war zwei Jahre auf Montage.");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: texts.send })).toBeFocused();
}

/** Waits until the form has been open as long as a person needs at least. */
const waitLikeAPerson = (page: Page, opened: number) =>
  page.waitForTimeout(
    Math.max(0, MIN_FILL_TIME_MS + 500 - (Date.now() - opened)),
  );

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`application pages at ${name}`, () => {
    test.use({ viewport: { width, height } });

    for (const path of THANKS_PAGES) {
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

    test("the form has no axe violations with errors shown", async ({
      page,
    }) => {
      await openForm(page, "/karriere");
      await page.getByRole("button", { name: TEXTS.de.send }).click();
      await expect(form(page).getByRole("alert")).toBeVisible();

      expect(await axeViolations(page)).toEqual([]);
    });
  });
}

test.describe("application thank-you pages", () => {
  for (const path of THANKS_PAGES) {
    test(`${path} is noindex`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }

  test("/karriere/danke does not scroll sideways", async ({ page }) => {
    await page.goto("/karriere/danke");
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

  test("the language switch goes to the other thank-you page", async ({
    page,
  }) => {
    await page.goto("/karriere/danke");

    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/careers\/thank-you$/);
  });
});

for (const language of ["de", "en"] as const) {
  const texts = TEXTS[language];

  test.describe(`application form in ${language}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("is sent with the keyboard alone and ends on the thank-you page", async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await openForm(page, texts.path);
      const opened = Date.now();

      await fillWithKeyboard(page, language);
      // Like a person: the server ignores a form sent in under 3 seconds.
      await waitLikeAPerson(page, opened);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(texts.thanks);
      await expect(page.locator("h1")).toHaveText(texts.thanksTitle);
      expect(problems).toEqual([]);
    });

    test("shows the errors under the fields and on top, focus on the first", async ({
      page,
    }) => {
      await openForm(page, texts.path);
      await page.getByRole("button", { name: texts.send }).click();

      const summary = form(page).getByRole("alert");
      await expect(summary.getByRole("heading")).toHaveText(texts.summaryTitle);
      await expect(summary.getByRole("link")).toHaveText([...texts.errors]);
      await expect(page.locator("#application-job")).toBeFocused();
      await expect(page.locator("#application-job-error")).toContainText(
        texts.errors[0],
      );
      await expect(page.locator("#application-name")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(page.locator("#application-phone-error")).toContainText(
        texts.errors[2],
      );
      // Optional fields stay quiet.
      await expect(page.locator("#application-email")).not.toHaveAttribute(
        "aria-invalid",
      );
      await expect(page.locator("#application-message")).not.toHaveAttribute(
        "aria-invalid",
      );

      // A link in the list moves the focus into its field.
      await summary.getByRole("link", { name: texts.errors[1] }).click();
      await expect(page.locator("#application-name")).toBeFocused();

      // The error follows the typing once it is shown.
      await page.keyboard.type("Lukas Beispiel");
      await expect(page.locator("#application-name-error")).toHaveCount(0);
      await expect(summary.getByRole("link")).toHaveCount(
        texts.errors.length - 1,
      );
      await expect(page).toHaveURL(new RegExp(`${texts.path}$`));
    });

    test("explains a wrong phone number and a long message", async ({
      page,
    }) => {
      await openForm(page, texts.path);
      await page.getByRole("radio", { name: texts.trialDay }).check();
      await page.locator("#application-name").fill("Mia Beispiel");
      await page.locator("#application-phone").fill("anrufen");
      await page.locator("#application-experience").check();
      await page.locator("#application-start").fill("Sommerferien");
      await page.locator("#application-callTime").check();
      await page.locator("#application-message").fill("a".repeat(501));
      await page.getByRole("button", { name: texts.send }).click();

      await expect(form(page).getByRole("alert").getByRole("link")).toHaveText([
        texts.phoneInvalid,
        texts.messageLong,
      ]);
      await expect(page.locator("#application-phone")).toBeFocused();
    });

    test("the trial day's button chooses the trial day in the form", async ({
      page,
    }) => {
      await openForm(page, texts.path);
      const button = page
        .getByRole("region", {
          name: language === "de" ? /Schnuppertag/ : /Taster day/,
        })
        .getByRole("link");
      await button.focus();
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(
        new RegExp(`${texts.path}\\?stelle=schnuppertag#bewerben$`),
      );
      const trial = form(page).getByRole("radio", { name: texts.trialDay });
      await expect(trial).toBeChecked();
      // The keyboard goes on in the form: the chosen card, then the name.
      await expect(trial).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.locator("#application-name")).toBeFocused();
    });
  });
}

test.describe("application: trap, job pages and links", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a filled trap field still ends on the thank-you page", async ({
    page,
  }) => {
    await openForm(page, "/karriere");
    // People never reach it: it is out of sight and out of the tab order.
    await expect(page.locator("#application-trap")).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await page.locator("#application-trap").fill("https://spam.example", {
      force: true,
    });
    const opened = Date.now();

    await fillWithKeyboard(page, "de");
    await waitLikeAPerson(page, opened);
    await page.keyboard.press("Enter");

    // The bot learns nothing; the server sends no mail (Vitest checks that).
    await expect(page).toHaveURL(TEXTS.de.thanks);
  });

  test("a job page chooses its job and sends it", async ({ page }) => {
    const problems = watchConsole(page);
    await openForm(page, "/karriere/monteur");
    const opened = Date.now();

    const apply = form(page);
    await expect(
      apply.getByRole("radio", {
        name: "Monteur für Möbel und Küchen (m/w/d)",
      }),
    ).toBeChecked();
    await expect(apply.getByRole("radio", { checked: true })).toHaveCount(1);

    await page.locator("#application-name").fill("Lukas Beispiel");
    await page.locator("#application-phone").fill("0171 2345678");
    await page.locator("#application-experience").check();
    await page.locator("#application-start").fill("ab sofort");
    await page.locator("#application-callTime").check();
    await waitLikeAPerson(page, opened);
    await page.getByRole("button", { name: TEXTS.de.send }).click();

    await expect(page).toHaveURL(TEXTS.de.thanks);
    expect(problems).toEqual([]);
  });

  test("the English job page chooses its job", async ({ page }) => {
    await openForm(page, "/en/careers/joiner");

    await expect(
      form(page).getByRole("radio", { name: "Joiner (m/f/d)", exact: true }),
    ).toBeChecked();
  });

  test("the home page's trial day button opens the form with it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Schnuppertag anfragen" }).click();

    await expect(page).toHaveURL(/\/karriere\?stelle=schnuppertag#bewerben$/);
    await expect(
      form(page).getByRole("radio", { name: TEXTS.de.trialDay }),
    ).toBeChecked();
  });

  test("an unknown ?stelle= chooses nothing", async ({ page }) => {
    await openForm(page, "/karriere?stelle=garage");

    await expect(form(page).getByRole("radio", { checked: true })).toHaveCount(
      0,
    );
  });
});
