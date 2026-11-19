import type { CollectionConfig, GlobalConfig, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { revalidateSite } = await import("../../src/hooks/revalidate-site");
const { Jobs } = await import("../../src/collections/Jobs");
const { Media } = await import("../../src/collections/Media");
const { Projects } = await import("../../src/collections/Projects");
const { Services } = await import("../../src/collections/Services");
const { Team } = await import("../../src/collections/Team");
const { Testimonials } = await import("../../src/collections/Testimonials");
const { Users } = await import("../../src/collections/Users");
const { HomePage } = await import("../../src/globals/HomePage");
const { SiteSettings } = await import("../../src/globals/SiteSettings");

const makeReq = () => {
  const error = vi.fn();
  const req = { payload: { logger: { error } } } as unknown as PayloadRequest;
  return { req, error };
};

describe("revalidateSite", () => {
  beforeEach(() => {
    revalidatePath.mockReset();
  });

  it("refreshes the whole site and hands the document back", () => {
    const { req } = makeReq();
    const doc = { id: 1 };
    expect(revalidateSite({ context: {}, doc, req })).toBe(doc);
    expect(revalidatePath).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does nothing when the seed turns it off", () => {
    const { req } = makeReq();
    const doc = { id: 1 };
    expect(
      revalidateSite({ context: { disableRevalidate: true }, doc, req }),
    ).toBe(doc);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("logs a failed refresh instead of breaking the save", () => {
    revalidatePath.mockImplementation(() => {
      throw new Error("static generation store missing");
    });
    const { req, error } = makeReq();
    const doc = { id: 1 };
    expect(revalidateSite({ context: {}, doc, req })).toBe(doc);
    expect(error).toHaveBeenCalledOnce();
  });
});

describe.each<CollectionConfig>([
  Services,
  Projects,
  Jobs,
  Team,
  Testimonials,
  Media,
  Users,
])("collection $slug", (collection) => {
  it("refreshes the site after every save and delete", () => {
    expect(collection.hooks?.afterChange).toContain(revalidateSite);
    expect(collection.hooks?.afterDelete).toContain(revalidateSite);
  });
});

describe.each<GlobalConfig>([SiteSettings, HomePage])(
  "global $slug",
  (global) => {
    it("refreshes the site after every save", () => {
      expect(global.hooks?.afterChange).toContain(revalidateSite);
    });
  },
);
