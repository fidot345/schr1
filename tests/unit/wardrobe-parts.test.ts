import { Box3, Euler, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  CAMERA,
  PARTS,
  type PartMotion,
  partsOfStep,
  placePart,
  type Vec3,
  type WardrobePart,
} from "@/components/wardrobe/parts";
import { STEP_RANGES, stepAt } from "@/components/wardrobe/steps";

/*
 * The wardrobe of the 3D scene, BRIEF.md section 4: its parts as the brief
 * lists them, a wardrobe without parts inside one another, a stack the
 * parts can leave from the top, and flights that start in the stack and
 * end in the wardrobe.
 */

/** 0.1 mm: parts that only touch do not count as inside one another. */
const TOUCH = 0.0001;

const byId = (id: string): WardrobePart => {
  const part = PARTS.find((item) => item.id === id);
  if (!part) throw new Error(`no part ${id}`);
  return part;
};

const UP = new Vector3(0, 1, 0);

/** The 8 corners of a part of `size` at `position`, turned by `quaternion`. */
function cornersOf(
  size: Vec3,
  position: Vector3,
  quaternion: Quaternion,
): Vector3[] {
  const corners: Vector3[] = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        corners.push(
          new Vector3((x * size[0]) / 2, (y * size[1]) / 2, (z * size[2]) / 2)
            .applyQuaternion(quaternion)
            .add(position),
        );
      }
    }
  }
  return corners;
}

const stackTurn = (part: WardrobePart): Quaternion =>
  new Quaternion().setFromEuler(new Euler(...part.stack.rotation, "YXZ"));

const assembledBox = (part: WardrobePart): Box3 =>
  new Box3().setFromPoints(
    cornersOf(part.size, new Vector3(...part.assembled), new Quaternion()),
  );

/** The corners of a part in the stack, in the scene. */
const stackCorners = (part: WardrobePart): Vector3[] =>
  cornersOf(part.size, new Vector3(...part.stack.position), stackTurn(part));

/*
 * The stack is turned as a whole. In its own axes (the turn taken back) its
 * parts lie square, so their boxes are exact.
 */
const TURN = PARTS[0].stack.rotation[1];
const untilted = new Quaternion().setFromAxisAngle(UP, -TURN);

const stackBox = (part: WardrobePart): Box3 =>
  new Box3().setFromPoints(
    cornersOf(
      part.size,
      new Vector3(...part.stack.position).applyQuaternion(untilted),
      untilted.clone().multiply(stackTurn(part)),
    ),
  );

/** Whether two floor plans, given by their corners (x, z), are apart. */
function apartSeenFromAbove(a: Vector3[], b: Vector3[]): boolean {
  const axes = [
    [1, 0],
    [0, 1],
    [Math.cos(TURN), -Math.sin(TURN)],
    [Math.sin(TURN), Math.cos(TURN)],
  ];
  return axes.some(([x, z]) => {
    const along = (points: Vector3[]) => points.map((p) => p.x * x + p.z * z);
    return (
      Math.max(...along(a)) <= Math.min(...along(b)) + TOUCH ||
      Math.max(...along(b)) <= Math.min(...along(a)) + TOUCH
    );
  });
}

/** Whether two boxes share more than a touching face. */
const overlap = (a: Box3, b: Box3): boolean =>
  a.min.x < b.max.x - TOUCH &&
  b.min.x < a.max.x - TOUCH &&
  a.min.y < b.max.y - TOUCH &&
  b.min.y < a.max.y - TOUCH &&
  a.min.z < b.max.z - TOUCH &&
  b.min.z < a.max.z - TOUCH;

/** Whether the floor plans of two boxes overlap. */
const overlapSeenFromAbove = (a: Box3, b: Box3): boolean =>
  a.min.x < b.max.x - TOUCH &&
  b.min.x < a.max.x - TOUCH &&
  a.min.z < b.max.z - TOUCH &&
  b.min.z < a.max.z - TOUCH;

const pose = (part: WardrobePart, motion: PartMotion) => {
  const position = new Vector3();
  const quaternion = new Quaternion();
  placePart(part, motion, position, quaternion);
  return { position, quaternion };
};

const close = (actual: Vector3, expected: Vec3) => {
  expect(actual.x).toBeCloseTo(expected[0], 6);
  expect(actual.y).toBeCloseTo(expected[1], 6);
  expect(actual.z).toBeCloseTo(expected[2], 6);
};

describe("the parts of the wardrobe", () => {
  it("are the 16 of the brief, each with its size in metres", () => {
    const sizes = PARTS.map(({ size }) => size.join(" × ")).sort();

    expect(PARTS).toHaveLength(16);
    expect(new Set(PARTS.map(({ id }) => id)).size).toBe(16);
    expect(sizes).toEqual(
      [
        ...Array(2).fill("0.019 × 2 × 0.6"),
        ...Array(2).fill("1.162 × 0.019 × 0.6"),
        "0.019 × 1.962 × 0.56",
        ...Array(5).fill("0.5715 × 0.019 × 0.56"),
        "0.57 × 0.025 × 0.025",
        "1.2 × 2 × 0.008",
        ...Array(2).fill("0.597 × 1.996 × 0.019"),
        ...Array(2).fill("0.012 × 0.3 × 0.02"),
      ].sort(),
    );
    expect(byId("rail")).toMatchObject({ shape: "rod", material: "metal" });
    expect(byId("rail").assembled[1]).toBe(1.7);
    expect(byId("back-panel").material).toBe("birch");
    expect(byId("handle-left").material).toBe("polished-metal");
    expect(byId("handle-right").material).toBe("polished-metal");
    const oak = PARTS.filter(({ material }) => material === "oak");
    expect(oak.map(({ id }) => id)).not.toContain("back-panel");
    expect(oak).toHaveLength(12);
  });

  it("make a wardrobe 1.2 m wide and 2 m high, standing on the floor at the centre", () => {
    const box = new Box3();
    for (const part of PARTS) box.union(assembledBox(part));

    expect(box.min.y).toBeCloseTo(0, 6);
    expect(box.max.y).toBeCloseTo(2, 6);
    expect(box.min.x).toBeCloseTo(-0.6, 6);
    expect(box.max.x).toBeCloseTo(0.6, 6);
    // The back panel behind the carcass, the doors and handles in front.
    expect(box.min.z).toBeCloseTo(-0.308, 6);
    expect(box.max.z).toBeCloseTo(0.339, 6);
  });

  it("do not go into one another in the wardrobe", () => {
    const clashes: string[] = [];
    PARTS.forEach((a, i) => {
      for (const b of PARTS.slice(i + 1)) {
        if (overlap(assembledBox(a), assembledBox(b))) {
          clashes.push(`${a.id} / ${b.id}`);
        }
      }
    });

    expect(clashes).toEqual([]);
  });

  it("put the four left shelves at equal spaces and the right shelf above the rail", () => {
    const left = PARTS.filter(({ id }) => id.startsWith("shelf-left"));
    // From the base up to the top: the boards' faces, bottom and top.
    const faces = [byId("base"), ...left, byId("top")].map((part) =>
      assembledBox(part),
    );
    const spaces = faces
      .slice(1)
      .map((board, index) => board.min.y - faces[index].max.y);

    expect(left).toHaveLength(4);
    expect(spaces).toHaveLength(5);
    for (const space of spaces) {
      expect(space).toBeCloseTo(spaces[0], 6);
    }
    expect(byId("shelf-right").assembled[1]).toBeGreaterThan(1.7 + 0.05);
  });
});

describe("the stack", () => {
  it("lies on the floor or on other parts, none inside another", () => {
    const clashes: string[] = [];
    PARTS.forEach((a, i) => {
      expect(stackBox(a).min.y, a.id).toBeGreaterThanOrEqual(-TOUCH);
      for (const b of PARTS.slice(i + 1)) {
        if (overlap(stackBox(a), stackBox(b)))
          clashes.push(`${a.id} / ${b.id}`);
      }
    });

    expect(clashes).toEqual([]);
  });

  it("has every part lying flat, its thinnest side up", () => {
    for (const part of PARTS) {
      const size = stackBox(part).getSize(new Vector3());
      expect(size.y, part.id).toBeCloseTo(Math.min(...part.size), 6);
    }
  });

  it("has on top of each part only parts that leave before it", () => {
    const blocked: string[] = [];
    PARTS.forEach((below, i) => {
      PARTS.forEach((above, j) => {
        const a = stackBox(above);
        const b = stackBox(below);
        if (a.min.y >= b.max.y - TOUCH && overlapSeenFromAbove(a, b) && j > i) {
          blocked.push(`${below.id} under ${above.id}`);
        }
      });
    });

    expect(blocked).toEqual([]);
  });

  it("lies beside the place of the wardrobe, not on it", () => {
    const wardrobe = new Box3();
    for (const part of PARTS) wardrobe.union(assembledBox(part));
    const plan = [wardrobe.min, wardrobe.max];

    for (const part of PARTS) {
      expect(apartSeenFromAbove(stackCorners(part), plan), part.id).toBe(true);
    }
  });
});

describe("the storyboard", () => {
  it("has six steps that follow one another from 0 to 1", () => {
    expect(STEP_RANGES.map(({ step }) => step)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(STEP_RANGES[0].from).toBe(0);
    expect(STEP_RANGES[5].to).toBe(1);
    STEP_RANGES.slice(1).forEach((range, index) => {
      expect(range.from).toBe(STEP_RANGES[index].to);
    });
  });

  it("knows the step at each point of the scroll", () => {
    expect(stepAt(0)).toBe(1);
    expect(stepAt(0.149)).toBe(1);
    expect(stepAt(0.15)).toBe(2);
    expect(stepAt(0.5)).toBe(3);
    expect(stepAt(0.6)).toBe(4);
    expect(stepAt(0.8)).toBe(5);
    expect(stepAt(0.95)).toBe(6);
    expect(stepAt(1)).toBe(6);
  });

  it("brings the parts in the order of the brief", () => {
    const ids = (step: 2 | 3 | 4 | 5) => partsOfStep(step).map(({ id }) => id);

    expect(ids(2)).toEqual([
      "side-left",
      "side-right",
      "base",
      "top",
      "divider",
    ]);
    expect(ids(3)).toEqual([
      "shelf-left-1",
      "shelf-left-2",
      "shelf-left-3",
      "shelf-left-4",
      "shelf-right",
      "rail",
      "back-panel",
    ]);
    expect(ids(4)).toEqual(["door-left", "door-right"]);
    expect(ids(5)).toEqual(["handle-left", "handle-right"]);
    // PARTS is in the order of the steps.
    const steps = PARTS.map(({ step }) => step);
    expect(steps).toEqual([...steps].sort());
  });

  it("frames the whole stack and the finished wardrobe from the starting view", () => {
    for (const aspect of [0.75, 0.9, 1.1]) {
      const camera = new PerspectiveCamera(CAMERA.fov, aspect, 0.1, 50);
      camera.position.set(...CAMERA.start.position);
      camera.lookAt(...CAMERA.start.target);
      camera.updateMatrixWorld();

      for (const part of PARTS) {
        const assembled = assembledBox(part);
        for (const corner of [
          ...stackCorners(part),
          assembled.min,
          assembled.max,
        ]) {
          const seen = corner.clone().project(camera);
          expect(Math.abs(seen.x), `${part.id} at ${aspect}`).toBeLessThan(1);
          expect(Math.abs(seen.y), `${part.id} at ${aspect}`).toBeLessThan(1);
        }
      }
    }
  });

  it("shows the finished wardrobe whole from the end view, with room round it", () => {
    // Canvas shapes from a wide desktop window to a short phone screen.
    for (const aspect of [0.7, 0.9, 1.1, 1.4]) {
      const camera = new PerspectiveCamera(CAMERA.fov, aspect, 0.1, 50);
      camera.position.set(...CAMERA.end.position);
      camera.lookAt(...CAMERA.end.target);
      camera.updateMatrixWorld();

      for (const part of PARTS) {
        const corners = cornersOf(
          part.size,
          new Vector3(...part.assembled),
          new Quaternion(),
        );
        for (const corner of corners) {
          const seen = corner.project(camera);
          expect(Math.abs(seen.x), `${part.id} at ${aspect}`).toBeLessThan(0.9);
          expect(Math.abs(seen.y), `${part.id} at ${aspect}`).toBeLessThan(0.9);
        }
      }
    }
  });
});

describe("placePart", () => {
  const still: PartMotion = { lift: 0, fly: 0, swing: 0 };

  it("keeps a part in the stack until it lifts", () => {
    for (const part of PARTS) {
      const { position, quaternion } = pose(part, still);
      close(position, part.stack.position);
      expect(
        quaternion.angleTo(
          new Quaternion().setFromEuler(
            new Euler(...part.stack.rotation, "YXZ"),
          ),
        ),
      ).toBeCloseTo(0, 6);
    }
  });

  it("lifts each layer of the stack a little more than the one below", () => {
    const side = byId("side-left");
    const door = byId("door-left");
    const lifted = (part: WardrobePart) =>
      pose(part, { ...still, lift: 1 }).position.y - part.stack.position[1];

    expect(lifted(door)).toBeGreaterThan(0);
    expect(lifted(side)).toBeGreaterThan(lifted(door));
  });

  it("starts the flight where the lift ends and goes up first", () => {
    for (const part of PARTS) {
      const lifted = pose(part, { ...still, lift: 1 }).position;
      const start = pose(part, { lift: 1, fly: 1e-6, swing: 0 }).position;
      const early = pose(part, { lift: 1, fly: 0.05, swing: 0 }).position;

      expect(start.distanceTo(lifted), part.id).toBeLessThan(1e-3);
      expect(early.y, part.id).toBeGreaterThan(lifted.y);
    }
  });

  it("ends the flight in the wardrobe, standing upright", () => {
    for (const part of PARTS.filter(({ hinge }) => !hinge)) {
      const { position, quaternion } = pose(part, {
        lift: 1,
        fly: 1,
        swing: 0,
      });
      close(position, part.assembled);
      expect(quaternion.angleTo(new Quaternion()), part.id).toBeCloseTo(0, 6);
    }
  });

  it("brings a door in open on its hinge and closes it", () => {
    // The left door arrives open by 75°, the right one, nearer the camera, by 90°.
    expect(byId("door-left").hinge?.open).toBeCloseTo((-75 * Math.PI) / 180, 6);
    expect(byId("door-right").hinge?.open).toBeCloseTo(Math.PI / 2, 6);
    for (const door of PARTS.filter(({ hinge }) => hinge)) {
      const open = pose(door, { lift: 1, fly: 1, swing: 0 });
      const closed = pose(door, { lift: 1, fly: 1, swing: 1 });

      // Open, the door stands out in front of the wardrobe.
      expect(open.position.z).toBeGreaterThan(door.assembled[2] + 0.2);
      expect(Math.abs(open.quaternion.angleTo(new Quaternion()))).toBeCloseTo(
        Math.abs(door.hinge?.open ?? 0),
        6,
      );
      // The edge on the hinge stays where it is while the door closes.
      const edge = (motion: PartMotion) => {
        const { position, quaternion } = pose(door, motion);
        const outer = Math.sign(door.hinge?.x ?? 0) * (door.size[0] / 2);
        return new Vector3(outer, 0, -door.size[2] / 2)
          .applyQuaternion(quaternion)
          .add(position);
      };
      const atStart = edge({ lift: 1, fly: 1, swing: 0 });
      const halfway = edge({ lift: 1, fly: 1, swing: 0.5 });
      expect(halfway.distanceTo(atStart), door.id).toBeLessThan(1e-6);

      close(closed.position, door.assembled);
      expect(closed.quaternion.angleTo(new Quaternion())).toBeCloseTo(0, 6);
    }
  });

  /*
   * Lying, a door's 2 m reach out past the right side of the wardrobe
   * (session 40: the right door stuck out there at an angle). So it stands
   * up while it rises off the stack, before it goes anywhere, and its foot
   * stays above the floor all the way.
   */
  it("stands a door up while it rises, above the floor", () => {
    const degrees = (radians: number) => (radians * 180) / Math.PI;
    for (const door of PARTS.filter(({ hinge }) => hinge)) {
      const lifted = pose(door, { lift: 1, fly: 0, swing: 0 }).position;
      let risen = false;
      let moved = false;
      for (let fly = 0; fly <= 1; fly += 0.005) {
        const { position, quaternion } = pose(door, { lift: 1, fly, swing: 0 });
        const lowest = Math.min(
          ...cornersOf(door.size, position, quaternion).map(({ y }) => y),
        );
        const tilt = degrees(
          new Vector3(0, 1, 0).applyQuaternion(quaternion).angleTo(UP),
        );
        const aside = Math.hypot(position.x - lifted.x, position.z - lifted.z);

        expect(lowest, `${door.id} at ${fly}`).toBeGreaterThanOrEqual(0);
        if (!risen && position.y >= 1) {
          risen = true;
          expect(tilt, `${door.id} 1 m up`).toBeLessThan(45);
        }
        if (!moved && aside >= 0.3) {
          moved = true;
          expect(tilt, `${door.id} 0.3 m aside`).toBeLessThan(30);
        }
      }
      expect(risen && moved, door.id).toBe(true);
    }
  });
});
