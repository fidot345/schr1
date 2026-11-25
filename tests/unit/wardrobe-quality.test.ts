import { describe, expect, it } from "vitest";
import {
  isWeakDevice,
  QUALITIES,
  qualityFor,
  REBUILDS,
} from "@/components/wardrobe/quality";

/*
 * How much the 3D scene asks of the graphics card: full at first, lighter
 * on a weak phone and with each new build after a lost context (Maxon,
 * session 37).
 */

/** A browser that tells `memory` (GiB) and `cores`, as navigator does. */
const device = (memory: number | undefined, cores: number): Navigator => {
  const fake: Navigator = Object.create(navigator);
  Object.defineProperty(fake, "hardwareConcurrency", { value: cores });
  if (memory !== undefined) {
    Object.defineProperty(fake, "deviceMemory", { value: memory });
  }
  return fake;
};

describe("qualityFor", () => {
  it("starts with the brief's settings: dpr up to 1.75, smooth edges, 1K wood", () => {
    expect(qualityFor(0, false)).toMatchObject({
      dpr: [1, 1.75],
      antialias: true,
      realShadows: true,
      textureSize: 1024,
    });
  });

  it("starts one step lighter on a weak device", () => {
    expect(qualityFor(0, true)).toBe(QUALITIES[1]);
    expect(qualityFor(0, true).antialias).toBe(false);
  });

  it("gets lighter with each new build and stays at the lightest", () => {
    const builds = Array.from({ length: REBUILDS + 1 }, (_, build) =>
      qualityFor(build, false),
    );

    expect(builds).toEqual([
      QUALITIES[0],
      QUALITIES[1],
      QUALITIES[2],
      QUALITIES[2],
    ]);
  });

  it("asks less of every setting from step to step", () => {
    for (let step = 1; step < QUALITIES.length; step++) {
      const lighter = QUALITIES[step];
      const before = QUALITIES[step - 1];
      expect(lighter.dpr[1]).toBeLessThan(before.dpr[1]);
      expect(lighter.textureSize).toBeLessThanOrEqual(before.textureSize);
      expect(lighter.contactShadows).toBeLessThanOrEqual(before.contactShadows);
      expect(lighter.environment).toBeLessThan(before.environment);
      expect(Number(lighter.antialias)).toBeLessThanOrEqual(
        Number(before.antialias),
      );
    }
    // The lightest one draws one canvas pixel per CSS pixel.
    expect(QUALITIES.at(-1)?.dpr).toEqual([1, 1]);
  });
});

describe("isWeakDevice", () => {
  it("finds a phone of 2 GiB or less, or of 4 cores or fewer, weak", () => {
    expect(isWeakDevice(device(2, 8))).toBe(true);
    expect(isWeakDevice(device(1, 8))).toBe(true);
    expect(isWeakDevice(device(8, 4))).toBe(true);
  });

  it("finds a phone of 4 GiB and 8 cores, or one that does not tell its memory, not weak", () => {
    expect(isWeakDevice(device(4, 8))).toBe(false);
    expect(isWeakDevice(device(undefined, 8))).toBe(false);
  });

  it("does not count unknown cores as few", () => {
    expect(isWeakDevice(device(undefined, 0))).toBe(false);
  });
});
