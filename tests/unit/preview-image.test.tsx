import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  homePreview,
  jobPreview,
  PREVIEW_SIZE,
  previewPath,
  sitePreview,
} from "@/lib/preview";
import { PREVIEW_COLORS, previewImageResponse } from "@/lib/preview-image";

vi.mock("next-intl/server", () => import("./support/translations"));

/** What the admin panel holds; each test can empty a field. */
const data = vi.hoisted(() => ({
  tagline: {
    de: "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
    en: "Joinery with its own workshop in Wendelfing, since 1989.",
  } as Record<"de" | "en", string | null>,
  heroTitle: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
  jobOpen: true,
}));

vi.mock("@/lib/content", () => ({
  getSiteSettings: async (locale: "de" | "en") => ({
    company: { logoWord: "Tannrieder" },
    tagline: data.tagline[locale],
  }),
  getHomePage: async () => ({
    hero: {
      title: data.heroTitle,
      text: "Küchen, Einbauschränke, Türen und Innenausbau.",
    },
  }),
  getJob: async (locale: "de" | "en") =>
    data.jobOpen
      ? {
          title: locale === "de" ? "Schreiner (m/w/d)" : "Joiner (m/f/d)",
          employmentType: "full_time",
          start: locale === "de" ? "ab sofort" : "immediately",
        }
      : null,
}));

const TAGLINE = { ...data.tagline };

afterEach(() => {
  data.tagline = { ...TAGLINE };
  data.heroTitle = "Möbel nach Maß aus unserer Werkstatt in Wendelfing";
  data.jobOpen = true;
});

const css = readFileSync("src/app/(frontend)/globals.css", "utf8");

describe("preview image colors", () => {
  it.each(Object.entries(PREVIEW_COLORS))(
    "%s is the design token's %s",
    (name, hex) => {
      const token = css.match(
        new RegExp(`^\\s*--color-${name}:\\s*([^;]+);`, "m"),
      )?.[1];
      expect(token?.trim().toLowerCase()).toBe(hex);
    },
  );
});

describe("site preview", () => {
  it("shows the tagline in the page's language and says so in its alt text", async () => {
    expect(await sitePreview("de")).toEqual({
      path: "/de/og/site.png",
      alt: `Schreinerei Tannrieder: ${TAGLINE.de}`,
      content: {
        descriptor: "Schreinerei",
        logoWord: "Tannrieder",
        title: TAGLINE.de,
      },
    });
    expect(await sitePreview("en")).toMatchObject({
      path: "/en/og/site.png",
      content: { title: TAGLINE.en },
    });
  });

  it("shows the site's name without a tagline", async () => {
    data.tagline = { de: null, en: null };
    expect(await sitePreview("de")).toMatchObject({
      alt: "Schreinerei Tannrieder",
      content: { title: "Schreinerei Tannrieder" },
    });
  });
});

describe("home preview", () => {
  it("shows the title and the text of the first screen", async () => {
    expect(await homePreview("de")).toEqual({
      path: "/de/og/home.png",
      alt: "Schreinerei Tannrieder: Möbel nach Maß aus unserer Werkstatt in Wendelfing",
      content: {
        descriptor: "Schreinerei",
        logoWord: "Tannrieder",
        title: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
        subtitle: "Küchen, Einbauschränke, Türen und Innenausbau.",
      },
    });
  });

  it("falls back to the site's name without a title", async () => {
    data.heroTitle = "  ";
    expect(await homePreview("de")).toMatchObject({
      alt: "Schreinerei Tannrieder",
      content: { title: "Schreinerei Tannrieder" },
    });
  });
});

describe("job preview", () => {
  it("shows that we are hiring, the job, its kind and its start", async () => {
    expect(await jobPreview("de", "schreiner")).toEqual({
      path: "/de/og/jobs/schreiner/image.png",
      alt: "Schreinerei Tannrieder stellt ein: Schreiner (m/w/d)",
      content: {
        descriptor: "Schreinerei",
        logoWord: "Tannrieder",
        eyebrow: "Wir stellen ein",
        title: "Schreiner (m/w/d)",
        subtitle: "Vollzeit · ab sofort",
      },
    });
    expect(await jobPreview("en", "joiner")).toMatchObject({
      path: "/en/og/jobs/joiner/image.png",
      alt: "Schreinerei Tannrieder is hiring: Joiner (m/f/d)",
      content: { eyebrow: "We're hiring", subtitle: "Full-time · immediately" },
    });
  });

  it("is not there for a job that is not open", async () => {
    data.jobOpen = false;
    expect(await jobPreview("de", "schreiner")).toBeNull();
  });
});

describe("preview image paths", () => {
  it("end in .png, so the proxy passes them on like files", () => {
    for (const path of [
      previewPath.site("de"),
      previewPath.home("en"),
      previewPath.job("de", "schreiner"),
    ]) {
      expect(path).toMatch(/\.png$/);
    }
  });
});

describe("preview image", () => {
  it("is a 1200 x 630 PNG drawn with the local font", async () => {
    const response = await previewImageResponse({
      descriptor: "Schreinerei",
      logoWord: "Tannrieder",
      eyebrow: "Wir stellen ein",
      title: "Schreiner (m/w/d) – Möbel, Küchen und Türen für die Gegend",
      subtitle: "Vollzeit · ab sofort",
    });
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    // The IHDR chunk: width and height right after its name.
    expect(png.readUInt32BE(16)).toBe(PREVIEW_SIZE.width);
    expect(png.readUInt32BE(20)).toBe(PREVIEW_SIZE.height);
  });
});
