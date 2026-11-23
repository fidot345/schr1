import { expect, test } from "@playwright/test";

/*
 * Without JavaScript the forms do not work, BRIEF.md section 5 "Formen":
 * every page with a form then says so and gives the phone number as a link.
 * The number is the site settings' from the seed.
 */

test.use({ javaScriptEnabled: false });

const PAGES = [
  { path: "/anfrage", text: "Das Formular braucht JavaScript." },
  { path: "/en/request", text: "The form needs JavaScript." },
  { path: "/karriere", text: "Das Formular braucht JavaScript." },
  { path: "/en/careers", text: "The form needs JavaScript." },
  { path: "/karriere/monteur", text: "Das Formular braucht JavaScript." },
  { path: "/en/careers/joiner", text: "The form needs JavaScript." },
] as const;

for (const { path, text } of PAGES) {
  test(`${path} without JavaScript shows the phone number`, async ({
    page,
  }) => {
    await page.goto(path);

    const note = page.locator("main p").filter({ hasText: text });
    await expect(note).toHaveCount(1);
    await expect(note).toBeVisible();
    await expect(
      note.getByRole("link", { name: "089 99998 412" }),
    ).toHaveAttribute("href", /^tel:\+?[0-9]+$/);
  });
}
