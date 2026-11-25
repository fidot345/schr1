import { BoxGeometry, type BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { grainAxis, grainOffset, layGrain } from "@/components/wardrobe/grain";
import { PARTS, type Vec3 } from "@/components/wardrobe/parts";

/*
 * The wood grain of the 3D scene, BRIEF.md section 4 "Материалы и свет":
 * it runs along the long side of every board, on all its faces; the
 * textures have it running up the picture (v).
 */

const byId = (id: string) => {
  const part = PARTS.find((item) => item.id === id);
  if (!part) throw new Error(`no part ${id}`);
  return part;
};

/** A board as fiber's RoundedBox leaves it: centred, without an index. */
const boardOf = (size: Vec3): BufferGeometry =>
  new BoxGeometry(...size).toNonIndexed();

type Point = { position: Vec3; normal: Vec3; uv: [number, number] };

function pointsOf(geometry: BufferGeometry): Point[] {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  return Array.from({ length: position.count }, (_, index) => ({
    position: [
      position.getX(index),
      position.getY(index),
      position.getZ(index),
    ],
    normal: [normal.getX(index), normal.getY(index), normal.getZ(index)],
    uv: [uv.getX(index), uv.getY(index)],
  }));
}

/** The points of the face whose outward normal is `axis` (0 x, 1 y, 2 z). */
const face = (points: Point[], axis: number) =>
  points.filter(({ normal }) => normal[axis] > 0.99);

/** How far u and v go on a face. */
function spread(points: Point[]) {
  const us = points.map(({ uv }) => uv[0]);
  const vs = points.map(({ uv }) => uv[1]);
  return {
    u: Math.max(...us) - Math.min(...us),
    v: Math.max(...vs) - Math.min(...vs),
  };
}

describe("grainAxis", () => {
  it("is the long side of each board", () => {
    expect(grainAxis(byId("side-left").size)).toBe(1);
    expect(grainAxis(byId("divider").size)).toBe(1);
    expect(grainAxis(byId("door-right").size)).toBe(1);
    expect(grainAxis(byId("back-panel").size)).toBe(1);
    expect(grainAxis(byId("base").size)).toBe(0);
    expect(grainAxis(byId("top").size)).toBe(0);
    // The shelves are 571.5 mm wide and 560 mm deep: grain across the wardrobe.
    expect(grainAxis(byId("shelf-left-1").size)).toBe(0);
    expect(grainAxis([0.1, 0.019, 0.5])).toBe(2);
  });
});

describe("layGrain", () => {
  it("runs the grain up a side, on its large face and on its front edge", () => {
    const size = byId("side-left").size;
    const geometry = boardOf(size);
    layGrain(geometry, size, 1, [0, 0]);
    const points = pointsOf(geometry);

    // Large face (towards x): v up the 2 m, u across the 0.6 m depth.
    expect(spread(face(points, 0))).toEqual({
      u: expect.closeTo(0.6, 6),
      v: expect.closeTo(2, 6),
    });
    // Front edge (towards z): v up, u across the 19 mm.
    expect(spread(face(points, 2))).toEqual({
      u: expect.closeTo(0.019, 6),
      v: expect.closeTo(2, 6),
    });
  });

  it("runs the grain across the wardrobe on base and shelves", () => {
    for (const id of ["base", "shelf-right"]) {
      const size = byId(id).size;
      const geometry = boardOf(size);
      layGrain(geometry, size, 1, [0, 0]);
      const top = spread(face(pointsOf(geometry), 1));

      expect(top.v, id).toBeCloseTo(size[0], 6);
      expect(top.u, id).toBeCloseTo(size[2], 6);
    }
  });

  it("counts in tiles of the texture and moves the picture by the offset", () => {
    const size = byId("door-left").size;
    const plain = boardOf(size);
    const moved = boardOf(size);
    layGrain(plain, size, 1.83, [0, 0]);
    layGrain(moved, size, 1.83, [0.25, 0.5]);
    const front = (geometry: BufferGeometry) => face(pointsOf(geometry), 2);

    expect(spread(front(plain)).v).toBeCloseTo(1.996 / 1.83, 6);
    front(plain).forEach((point, index) => {
      const shifted = front(moved)[index];
      expect(shifted.uv[0] - point.uv[0]).toBeCloseTo(0.25, 6);
      expect(shifted.uv[1] - point.uv[1]).toBeCloseTo(0.5, 6);
    });
  });

  it("gives every point of a board a place on the texture, end faces too", () => {
    const size = byId("side-right").size;
    const geometry = boardOf(size);
    layGrain(geometry, size, 1.83, grainOffset(1));
    const uv = geometry.getAttribute("uv");

    expect(uv.count).toBe(geometry.getAttribute("position").count);
    for (let index = 0; index < uv.count; index++) {
      expect(Number.isFinite(uv.getX(index))).toBe(true);
      expect(Number.isFinite(uv.getY(index))).toBe(true);
    }
  });
});

describe("grainOffset", () => {
  it("gives the parts different pieces of the wood, within one tile", () => {
    const offsets = PARTS.map((_, index) => grainOffset(index));
    const distinct = new Set(offsets.map((offset) => offset.join(" ")));

    expect(distinct.size).toBe(PARTS.length);
    for (const [u, v] of offsets) {
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
