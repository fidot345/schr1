import { describe, expect, it, vi } from "vitest";
import { localeSwitchHref } from "@/i18n/locale-switch-href";
import { resolveRoutePathname } from "@/i18n/route-pathname";

/* route-pathname.ts also holds the hook; its next-intl imports need a request. */
vi.mock("@/i18n/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/navigation", () => ({ useParams: () => ({}) }));

const raw = (path: string) =>
  path as Parameters<typeof resolveRoutePathname>[0];

describe("resolveRoutePathname", () => {
  it("keeps route templates and static routes", () => {
    expect(resolveRoutePathname("/leistungen/[slug]", "kuechen")).toBe(
      "/leistungen/[slug]",
    );
    expect(resolveRoutePathname("/kontakt", undefined)).toBe("/kontakt");
  });

  it("finds the template of a raw address through the slug", () => {
    expect(resolveRoutePathname(raw("/leistungen/kitchens"), "kitchens")).toBe(
      "/leistungen/[slug]",
    );
    expect(resolveRoutePathname(raw("/karriere/joiner"), "joiner")).toBe(
      "/karriere/[slug]",
    );
  });

  it("leaves an address it cannot match as it is", () => {
    expect(resolveRoutePathname(raw("/dev/ui"), undefined)).toBe("/dev/ui");
    expect(resolveRoutePathname(raw("/leistungen/kitchens"), "doors")).toBe(
      "/leistungen/kitchens",
    );
  });
});

describe("localeSwitchHref", () => {
  it("translates the slug through the map", () => {
    expect(
      localeSwitchHref(
        "/leistungen/[slug]",
        { locale: "de", slug: "kuechen" },
        { kuechen: "kitchens" },
      ),
    ).toEqual({ pathname: "/leistungen/[slug]", params: { slug: "kitchens" } });
  });

  it("keeps a slug the map does not know, even one named like a built-in", () => {
    const map = { kuechen: "kitchens" };
    expect(
      localeSwitchHref("/leistungen/[slug]", { slug: "tueren" }, map),
    ).toEqual({ pathname: "/leistungen/[slug]", params: { slug: "tueren" } });
    expect(
      localeSwitchHref("/leistungen/[slug]", { slug: "constructor" }, map),
    ).toEqual({
      pathname: "/leistungen/[slug]",
      params: { slug: "constructor" },
    });
  });

  it("returns static routes as they are", () => {
    expect(localeSwitchHref("/kontakt", { locale: "de" })).toBe("/kontakt");
    expect(localeSwitchHref("/", {})).toBe("/");
  });

  it("fills the slug of dynamic routes", () => {
    expect(
      localeSwitchHref("/karriere/[slug]", { locale: "de", slug: "schreiner" }),
    ).toEqual({ pathname: "/karriere/[slug]", params: { slug: "schreiner" } });
  });

  it("falls back to the home page without a slug", () => {
    expect(localeSwitchHref("/karriere/[slug]", {})).toBe("/");
  });
});
