import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import DevUiPage, {
  generateMetadata,
} from "@/app/(frontend)/[locale]/dev/ui/page";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { render } from "./support/render";

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

/* The showcase links with "#" and "tel:", so Link is never rendered; the
   mock only keeps next-intl's navigation out of Node. */
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
  getTranslations: async () => (key: string) => key,
}));

const props = (locale: "de" | "en") => ({
  params: Promise.resolve({ locale }),
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/dev/ui", () => {
  it("is a 404 in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(DevUiPage(props("de"))).rejects.toThrow("404");
    await expect(DevUiPage(props("en"))).rejects.toThrow("404");
    expect(await generateMetadata(props("de"))).toEqual({});
  });

  it("is noindex in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(await generateMetadata(props("de"))).toMatchObject({
      robots: { index: false, follow: false },
    });
  });

  it.each([
    ["de", de],
    ["en", en],
  ] as const)(
    "shows the palette and the whole type scale in %s",
    async (locale, messages) => {
      vi.stubEnv("NODE_ENV", "development");
      const html = render(await DevUiPage(props(locale)), locale);

      expect(html).toContain(`>${messages.DevUi.title}</h1>`);
      expect(html).toContain(`>${messages.DevUi.groups.colors}</h2>`);
      expect(html).toContain(`>${messages.DevUi.groups.typeScale}</h2>`);

      const hexes = [...css.matchAll(/--color-[a-z-]+: (#[0-9a-f]{6});/g)].map(
        (match) => match[1].toUpperCase(),
      );
      expect(hexes).toHaveLength(10);
      for (const hex of hexes) {
        expect(html).toContain(`>${hex}</p>`);
      }

      const steps = [
        ...new Set(
          [
            ...css.matchAll(/^\s*--text-([a-z][a-z0-9]*(?:-[a-z0-9]+)*): /gm),
          ].map((match) => match[1]),
        ),
      ];
      expect(steps).toHaveLength(12);
      for (const step of steps) {
        expect(html).toContain(`text-${step}"`);
      }
      expect(html.split(messages.DevUi.sample)).toHaveLength(13);
    },
  );

  it.each([
    ["de", de],
    ["en", en],
  ] as const)(
    "shows the components, with hover and focus pinned, in %s",
    async (locale, messages) => {
      vi.stubEnv("NODE_ENV", "development");
      const html = render(await DevUiPage(props(locale)), locale);

      for (const group of [
        "logo",
        "buttons",
        "links",
        "steps",
        "icons",
        "sections",
      ] as const) {
        expect(html).toContain(`>${messages.DevUi.groups[group]}</h2>`);
      }

      // Three Logo variants.
      expect(html).toContain('id="dev-logo-full"');
      expect(html).toContain('id="dev-logo-compact"');
      expect(html).toContain('id="dev-logo-light"');

      // Every interactive component in its three states.
      const hover = html.split('data-pin="hover"').length - 1;
      const focus = html.split('data-pin="focus"').length - 1;
      expect(hover).toBeGreaterThanOrEqual(10);
      expect(focus).toBe(hover);

      // The three Section variants, each named by its heading.
      for (const id of [
        "dev-section-default",
        "dev-section-moos",
        "dev-section-line",
      ]) {
        expect(html).toContain(`aria-labelledby="${id}"`);
        expect(html).toContain(`<h2 id="${id}"`);
      }

      // Step numbers: three states in two sizes.
      expect(html.split("rounded-full").length - 1).toBe(6);
    },
  );
});
