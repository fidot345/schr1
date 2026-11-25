import type Lenis from "lenis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  driveLenisWith,
  type FrameLoop,
  REDUCED_MOTION_QUERY,
  watchSmoothScroll,
} from "@/lib/smooth-scroll";

type FakeLenis = {
  options: unknown;
  time: number;
  raf: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

const created = vi.hoisted(() => [] as FakeLenis[]);

/* Lenis itself needs a real browser; this stand-in only records its life. */
vi.mock("lenis", () => ({
  default: class {
    options: unknown;
    time = 0;
    raf = vi.fn((time: number) => {
      this.time = time;
    });
    destroy = vi.fn();
    constructor(options: unknown) {
      this.options = options;
      created.push(this);
    }
  },
}));

/** The real Lenis behind a stand-in, for the functions that take one. */
const asLenis = (fake: FakeLenis): Lenis => fake as unknown as Lenis;

/** A MediaQueryList whose `matches` the test can flip. */
const fakeMediaQuery = (matches: boolean) => {
  const listeners = new Set<() => void>();
  return {
    matches,
    addEventListener: (_type: "change", listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: "change", listener: () => void) => {
      listeners.delete(listener);
    },
    listeners,
    switchTo(value: boolean) {
      this.matches = value;
      for (const listener of listeners) listener();
    },
  };
};

/** requestAnimationFrame that runs only when the test draws a frame. */
const frames = new Map<number, (time: number) => void>();
let lastFrameId = 0;
const drawFrame = (time: number) => {
  const due = [...frames.values()];
  frames.clear();
  for (const callback of due) callback(time);
};

/** A frame loop the test drives by hand, like GSAP's ticker. */
const handLoop = () => {
  let frame: ((time: number) => void) | null = null;
  const loop: FrameLoop = (next) => {
    frame = next;
    return () => {
      frame = null;
    };
  };
  return {
    loop,
    tick: (time: number) => frame?.(time),
    running: () => frame !== null,
  };
};

let media = fakeMediaQuery(false);
const queries: string[] = [];

beforeEach(() => {
  created.length = 0;
  queries.length = 0;
  frames.clear();
  vi.stubGlobal("window", {
    matchMedia: (query: string) => {
      queries.push(query);
      return media;
    },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: (time: number) => void) => {
    lastFrameId += 1;
    frames.set(lastFrameId, callback);
    return lastFrameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("watchSmoothScroll", () => {
  it("asks for prefers-reduced-motion: reduce", () => {
    media = fakeMediaQuery(false);
    watchSmoothScroll(() => {})();
    expect(queries).toEqual(["(prefers-reduced-motion: reduce)"]);
    expect(REDUCED_MOTION_QUERY).toBe("(prefers-reduced-motion: reduce)");
  });

  it("does not create Lenis while the system asks to reduce motion", () => {
    media = fakeMediaQuery(true);
    const onChange = vi.fn();
    const stop = watchSmoothScroll(onChange);

    expect(created).toEqual([]);
    expect(frames.size).toBe(0);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    stop();
  });

  it("creates one Lenis and drives it with the browser's frames", () => {
    media = fakeMediaQuery(false);
    const onChange = vi.fn();
    const stop = watchSmoothScroll(onChange);

    expect(created).toHaveLength(1);
    expect(created[0].options).toEqual({ autoRaf: false });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(created[0]);

    drawFrame(16);
    drawFrame(32);
    expect(created[0].raf.mock.calls).toEqual([[16], [32]]);
    stop();
  });

  it("follows the setting when it changes on the fly", () => {
    media = fakeMediaQuery(false);
    const onChange = vi.fn();
    const stop = watchSmoothScroll(onChange);
    const first = created[0];

    media.switchTo(true);
    expect(first.destroy).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(null);
    drawFrame(16);
    expect(first.raf).not.toHaveBeenCalled();

    media.switchTo(false);
    expect(created).toHaveLength(2);
    expect(onChange).toHaveBeenLastCalledWith(created[1]);
    stop();
  });

  it("stops watching, stops the frames and destroys Lenis on cleanup", () => {
    media = fakeMediaQuery(false);
    const stop = watchSmoothScroll(() => {});
    expect(media.listeners.size).toBe(1);

    stop();
    expect(media.listeners.size).toBe(0);
    expect(created[0].destroy).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });
});

describe("driveLenisWith", () => {
  it("moves Lenis to another loop and gives it back to the browser", () => {
    media = fakeMediaQuery(false);
    const stop = watchSmoothScroll(() => {});
    const lenis = created[0];
    drawFrame(5000);
    const ticker = handLoop();

    const giveBack = driveLenisWith(asLenis(lenis), ticker.loop);
    // The browser's frames stop; the clock starts over for the new loop.
    expect(frames.size).toBe(0);
    expect(lenis.time).toBe(0);
    ticker.tick(250);
    expect(lenis.raf).toHaveBeenLastCalledWith(250);

    giveBack();
    expect(ticker.running()).toBe(false);
    expect(lenis.time).toBe(0);
    drawFrame(5300);
    expect(lenis.raf).toHaveBeenLastCalledWith(5300);
    expect(lenis.raf).toHaveBeenCalledTimes(3);
    stop();
  });

  it("stops the lent loop when Lenis goes", () => {
    media = fakeMediaQuery(false);
    const stop = watchSmoothScroll(() => {});
    const ticker = handLoop();
    const giveBack = driveLenisWith(asLenis(created[0]), ticker.loop);

    media.switchTo(true);
    expect(ticker.running()).toBe(false);

    // Handing back a Lenis that is gone starts no frames.
    giveBack();
    expect(frames.size).toBe(0);
    stop();
  });

  it("leaves a Lenis alone that it does not run", () => {
    const stranger: FakeLenis = {
      options: {},
      time: 7,
      raf: vi.fn(),
      destroy: vi.fn(),
    };
    const ticker = handLoop();

    driveLenisWith(asLenis(stranger), ticker.loop)();
    expect(ticker.running()).toBe(false);
    expect(stranger.time).toBe(7);
  });
});
