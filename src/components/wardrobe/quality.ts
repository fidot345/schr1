/*
 * How much the scene asks of the graphics card, BRIEF.md section 4
 * "Скорость", in three steps from full to light. A phone short of memory
 * or cores starts one step lighter; each time the scene has to be built
 * anew (its WebGL context lost or not made), it goes one step lighter
 * still. The still picture comes only when that has not helped either
 * (Maxon, session 37).
 */

export type Quality = {
  /** Pixel density of the canvas: from 1 up to the screen's, at most the second. */
  dpr: [number, number];
  /** Smooth edges (multisampling): the most memory per pixel. */
  antialias: boolean;
  /** Real shadows from the light; even then on a computer only. */
  realShadows: boolean;
  /** The longest side of the wood textures, in pixels. */
  textureSize: number;
  /** Resolution of the soft shadows on the floor. */
  contactShadows: number;
  /** Resolution of each side of the cube with the light all round. */
  environment: number;
};

export const QUALITIES: readonly Quality[] = [
  {
    dpr: [1, 1.75],
    antialias: true,
    realShadows: true,
    textureSize: 1024,
    contactShadows: 512,
    environment: 256,
  },
  {
    dpr: [1, 1.5],
    antialias: false,
    realShadows: false,
    textureSize: 512,
    contactShadows: 256,
    environment: 128,
  },
  {
    dpr: [1, 1],
    antialias: false,
    realShadows: false,
    textureSize: 512,
    contactShadows: 256,
    environment: 64,
  },
];

/**
 * How often the scene is built anew, lighter each time, before the still
 * picture takes its place for good.
 */
export const REBUILDS = 3;

/** The quality of the scene's `rebuild`-th build (0 is the first one). */
export function qualityFor(rebuild: number, weak: boolean): Quality {
  const step = Math.min(rebuild + (weak ? 1 : 0), QUALITIES.length - 1);
  return QUALITIES[step];
}

/**
 * At most this much memory (GiB, as the browser rounds it) or this many
 * cores make a weak device: an older or cheaper phone.
 */
const WEAK = { memory: 2, cores: 4 };

/**
 * Whether `device` is weak. Chrome and Brave on Android tell their memory;
 * a browser that tells neither memory nor cores counts as not weak.
 */
export function isWeakDevice(device: Navigator): boolean {
  const memory =
    "deviceMemory" in device && typeof device.deviceMemory === "number"
      ? device.deviceMemory
      : undefined;
  const cores = device.hardwareConcurrency;
  return (
    (memory !== undefined && memory <= WEAK.memory) ||
    (cores > 0 && cores <= WEAK.cores)
  );
}
