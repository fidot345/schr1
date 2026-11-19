import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_QUERY, watchSmoothScroll } from "@/lib/smooth-scroll";

type FakeLenis = {
  options: unknown;
  destroy: ReturnType<typeof vi.fn>;
};

const created = vi.hoisted(() => [] as FakeLenis[]);

/* Lenis itself needs a real browser; this stand-in only records its life. */
vi.mock("lenis", () => ({
  default: class {
    options: unknown;
    destroy = vi.fn();
    constructor(options: unknown) {
      this.options = options;
      created.push(this);
    }
  },
}));

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

let media = fakeMediaQuery(false);
const queries: string[] = [];

beforeEach(() => {
  created.length = 0;
  queries.length = 0;
  vi.stubGlobal("window", {
    matchMedia: (query: string) => {
      queries.push(query);
      return media;
    },
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
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    stop();
  });

  it("creates one Lenis with its own frame loop otherwise", () => {
    media = fakeMediaQuery(false);
    const onChange = vi.fn();
    const stop = watchSmoothScroll(onChange);

    expect(created).toHaveLength(1);
    expect(created[0].options).toEqual({ autoRaf: true });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(created[0]);
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

    media.switchTo(false);
    expect(created).toHaveLength(2);
    expect(onChange).toHaveBeenLastCalledWith(created[1]);
    stop();
  });

  it("stops watching and destroys Lenis on cleanup", () => {
    media = fakeMediaQuery(false);
    const stop = watchSmoothScroll(() => {});
    expect(media.listeners.size).toBe(1);

    stop();
    expect(media.listeners.size).toBe(0);
    expect(created[0].destroy).toHaveBeenCalledOnce();
  });
});
