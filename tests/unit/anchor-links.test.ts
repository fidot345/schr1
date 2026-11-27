import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fragmentTarget,
  JUMP_WAIT,
  jumpWhenShown,
  routerSkipsJump,
} from "@/lib/anchor-links";

const OPEN = new URL(
  "http://localhost:3100/karriere?stelle=schnuppertag#bewerben",
);
const at = (path: string) => new URL(path, OPEN);

describe("routerSkipsJump", () => {
  it("is the trial day's button on the address it leads to", () => {
    const href = "/karriere?stelle=schnuppertag#bewerben";
    expect(routerSkipsJump(href, at(href), OPEN)).toBe(true);
  });

  it("leaves every link that changes the address to the router", () => {
    for (const href of [
      "/karriere?stelle=schreiner#bewerben",
      "/karriere#bewerben",
      "/karriere?stelle=schnuppertag#faq",
      "/en/careers?stelle=schnuppertag#bewerben",
    ]) {
      expect(routerSkipsJump(href, at(href), OPEN), href).toBe(false);
    }
  });

  it("leaves a link without a fragment alone", () => {
    const open = new URL("http://localhost:3100/karriere");
    expect(routerSkipsJump("/karriere", at("/karriere"), open)).toBe(false);
  });

  it("leaves plain anchors to the browser", () => {
    const href = "#bewerben";
    expect(routerSkipsJump(href, at(href), OPEN)).toBe(false);
  });
});

describe("fragmentTarget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubDocument = () => {
    const ids: string[] = [];
    vi.stubGlobal("document", {
      getElementById: (id: string) => {
        ids.push(id);
        return id === "über-uns" || id === "bewerben" ? { id } : null;
      },
    });
    return ids;
  };

  it("finds the element the fragment names, decoded", () => {
    const ids = stubDocument();
    expect(fragmentTarget("#bewerben")).toEqual({ id: "bewerben" });
    expect(fragmentTarget("#%C3%BCber-uns")).toEqual({ id: "über-uns" });
    expect(ids).toEqual(["bewerben", "über-uns"]);
  });

  it("is null without a fragment or without its element", () => {
    const ids = stubDocument();
    expect(fragmentTarget("")).toBeNull();
    expect(fragmentTarget("#")).toBeNull();
    expect(fragmentTarget("#gibt-es-nicht")).toBeNull();
    expect(ids).toEqual(["gibt-es-nicht"]);
  });
});

describe("jumpWhenShown", () => {
  const TO = new URL(
    "http://localhost:3100/karriere?stelle=schnuppertag#bewerben",
  );
  const frames = new Map<number, (time: number) => void>();
  let lastId = 0;
  const location = { href: "http://localhost:3100/karriere" };
  const target = { scrollIntoView: vi.fn() };

  /** Draws one frame at `time`: runs the callbacks asked for before it. */
  const drawFrame = (time: number) => {
    const due = [...frames.values()];
    frames.clear();
    for (const callback of due) callback(time);
  };

  beforeEach(() => {
    frames.clear();
    location.href = "http://localhost:3100/karriere";
    target.scrollIntoView.mockClear();
    vi.stubGlobal("window", { location });
    vi.stubGlobal("document", {
      getElementById: (id: string) => (id === "bewerben" ? target : null),
    });
    vi.stubGlobal("requestAnimationFrame", (callback: (t: number) => void) => {
      lastId += 1;
      frames.set(lastId, callback);
      return lastId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("jumps in the first frame that shows the address", () => {
    jumpWhenShown(TO);
    drawFrame(0);
    drawFrame(16);
    expect(target.scrollIntoView).not.toHaveBeenCalled();

    location.href = TO.href;
    drawFrame(32);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    drawFrame(48);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("jumps at once on the address that is open", () => {
    location.href = TO.href;
    jumpWhenShown(TO);
    drawFrame(0);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("gives up when the router does not show the address in time", () => {
    jumpWhenShown(TO);
    drawFrame(1000);
    drawFrame(1000 + JUMP_WAIT);
    expect(frames.size).toBe(0);

    location.href = TO.href;
    drawFrame(2000 + JUMP_WAIT);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing once cancelled", () => {
    const cancel = jumpWhenShown(TO);
    drawFrame(0);
    cancel();
    location.href = TO.href;
    drawFrame(16);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });
});
