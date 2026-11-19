import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DevUiPage, {
  generateMetadata,
} from "@/app/(frontend)/[locale]/dev/ui/page";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { render } from "./support/render";

/* Same stand-ins as in header-components.test.tsx: Link is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: {
    href: string | { pathname: string };
    locale?: string;
    children: ReactNode;
  }) => (
    <a
      href={typeof href === "string" ? href : href.pathname}
      data-locale={locale}
      {...rest}
    >
      {children}
    </a>
  ),
  usePathname: () => "/dev/ui",
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
  useParams: () => ({}),
}));

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
    "shows every group in %s during development",
    async (locale, messages) => {
      vi.stubEnv("NODE_ENV", "development");
      const html = render(await DevUiPage(props(locale)), locale);

      expect(html).toContain(`<h1 class="`);
      for (const title of Object.values(messages.DevUi.groups)) {
        expect(html).toContain(`>${title}</h2>`);
      }
      // The real header, footer and both error summaries are on the page.
      expect(html).toContain("<header ");
      expect(html).toContain("<footer ");
      expect(html).toContain(messages.Demo.notice);
      expect(html).toContain(messages.Form.errorSummary.titleFormal);
      expect(html).toContain(messages.Form.errorSummary.titleInformal);
    },
  );

  it("has unique ids", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = render(await DevUiPage(props("de")));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);

    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("links every error summary entry to a field on the page", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = render(await DevUiPage(props("de")));
    const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(html).toMatch(
        new RegExp(`<(input|textarea|select) [^>]*id="${target}"`),
      );
    }
  });

  it("keeps its demo data out of every other file", () => {
    const files = readdirSync("src", { recursive: true, encoding: "utf8" })
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) =>
        /demo-data["']/.test(readFileSync(join("src", file), "utf8")),
      );

    expect(files.map((file) => file.replaceAll("\\", "/"))).toEqual([
      "app/(frontend)/[locale]/dev/ui/DevUiShowcase.tsx",
    ]);
  });
});
