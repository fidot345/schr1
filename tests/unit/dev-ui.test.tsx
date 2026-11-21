import { afterEach, describe, expect, it, vi } from "vitest";
import DevUiPage, {
  generateMetadata,
} from "@/app/(frontend)/[locale]/dev/ui/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
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
});
