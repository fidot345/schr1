import gsap from "gsap";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  CAMERA,
  type CanvasShape,
  cameraAt,
  fovFor,
  PARTS,
  placePart,
  type Vec3,
} from "@/components/wardrobe/parts";
import { buildTimeline, createMotion } from "@/components/wardrobe/storyboard";

/*
 * The scene plays its whole storyboard in view, BRIEF.md section 4: from
 * the stack to the finished wardrobe no part leaves the canvas, on any
 * canvas the page gives the scene. On a phone the finished wardrobe fills
 * its canvas (Maxon, session 37).
 */

/**
 * Width over height of the canvas, as measured on the home page. Computer
 * layout: a tablet standing upright (768 × 1024), tall and wide windows.
 */
const COMPUTER_ASPECTS = [0.46, 0.54, 0.66, 0.75, 0.9, 1.23, 1.74];
/**
 * Phone layout, the scene above one caption: 430 × 932 and 412 × 915
 * (0.62), Pixel 7 in Playwright, 393 × 852, 360 × 800, 412 × 700 and
 * 360 × 640 (0.96).
 */
const PHONE_ASPECTS = [0.6, 0.62, 0.66, 0.7, 0.75, 0.86, 0.96, 1.1];
const CANVASES: CanvasShape[] = [
  ...COMPUTER_ASPECTS.map((aspect) => ({ aspect, phone: false })),
  ...PHONE_ASPECTS.map((aspect) => ({ aspect, phone: true })),
];
/** A part keeps this far from the edges (1 is the edge of the canvas). */
const INSIDE = 0.97;
/** Points of the scroll checked, evenly from 0 to 1. */
const SAMPLES = 400;

/** A camera on `canvas` at `progress` of the way from the start view to the end view. */
function cameraOn(canvas: CanvasShape, progress: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(CAMERA.fov, canvas.aspect, 0.1, 60);
  const target = new Vector3();
  camera.fov = cameraAt(progress, canvas, camera.position, target);
  camera.updateProjectionMatrix();
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return camera;
}

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

describe("fovFor", () => {
  it("keeps the 35° of the brief down to a canvas of 3 : 4", () => {
    expect(fovFor(0.75)).toBeCloseTo(CAMERA.fov, 6);
    expect(fovFor(1.74)).toBe(CAMERA.fov);
  });

  it("widens the view of a narrower canvas so it sees as far to the sides", () => {
    const across = (aspect: number) =>
      Math.tan((fovFor(aspect) * Math.PI) / 360) * aspect;

    expect(fovFor(0.46)).toBeGreaterThan(CAMERA.fov);
    expect(across(0.46)).toBeCloseTo(across(0.75), 6);
  });
});

describe("cameraAt", () => {
  const position = new Vector3();
  const target = new Vector3();

  it("starts from the start view with the field of view of fovFor", () => {
    for (const canvas of CANVASES) {
      const fov = cameraAt(0, canvas, position, target);
      expect(position.toArray()).toEqual([...CAMERA.start.position]);
      expect(target.toArray()).toEqual([...CAMERA.start.target]);
      expect(fov).toBe(fovFor(canvas.aspect));
    }
  });

  it("ends in Maxon's view on a computer window", () => {
    for (const aspect of [0.75, 0.9, 1.23, 1.74]) {
      const fov = cameraAt(1, { aspect, phone: false }, position, target);
      position.toArray().forEach((value, axis) => {
        expect(value).toBeCloseTo(CAMERA.end.position[axis], 9);
      });
      expect(target.toArray()).toEqual([...CAMERA.end.target]);
      expect(fov).toBe(CAMERA.fov);
    }
  });

  it("ends on the same line at 35°, on a phone not further than on a computer", () => {
    const end = new Vector3(...CAMERA.end.position);
    const endTarget = new Vector3(...CAMERA.end.target);
    const line = end.clone().sub(endTarget).normalize();

    for (const aspect of PHONE_ASPECTS) {
      cameraAt(1, { aspect, phone: false }, position, target);
      const computer = position.distanceTo(target);
      const fov = cameraAt(1, { aspect, phone: true }, position, target);
      const away = position.distanceTo(target);
      const direction = position.clone().sub(target).normalize();

      expect(fov).toBe(CAMERA.fov);
      expect(direction.dot(line)).toBeCloseTo(1, 9);
      // Nearer, unless the canvas is too narrow for either view (0.6).
      expect(away).toBeLessThanOrEqual(computer + 1e-9);
      if (aspect > 0.61) expect(away).toBeLessThan(computer);
    }
  });

  it("steps back on a canvas too narrow for the end view, instead of widening it", () => {
    for (const phone of [false, true]) {
      cameraAt(1, { aspect: 0.75, phone }, position, target);
      const wide = position.distanceTo(target);
      const fov = cameraAt(1, { aspect: 0.46, phone }, position, target);

      expect(fov).toBe(CAMERA.fov);
      expect(position.distanceTo(target)).toBeGreaterThan(wide);
    }
  });
});

describe("the storyboard", () => {
  it("keeps every part in the picture all the way, on every canvas", () => {
    const motion = createMotion();
    const timeline = gsap.timeline({ paused: true });
    buildTimeline(timeline, motion);
    const position = new Vector3();
    const quaternion = new Quaternion();
    const outside = new Map<string, string>();

    for (let sample = 0; sample <= SAMPLES; sample++) {
      const progress = sample / SAMPLES;
      timeline.progress(progress);

      for (const canvas of CANVASES) {
        const camera = cameraOn(canvas, motion.camera);

        PARTS.forEach((part, index) => {
          placePart(part, motion.parts[index], position, quaternion);
          for (const corner of cornersOf(part.size, position, quaternion)) {
            const seen = corner.project(camera);
            const layout = canvas.phone ? "phone" : "computer";
            const key = `${part.id} at ${canvas.aspect} (${layout})`;
            if (
              (Math.abs(seen.x) > INSIDE || Math.abs(seen.y) > INSIDE) &&
              !outside.has(key)
            ) {
              outside.set(
                key,
                `${key}: x ${seen.x.toFixed(2)}, y ${seen.y.toFixed(2)} at ${progress.toFixed(3)}`,
              );
            }
          }
        });
      }
    }

    expect([...outside.values()]).toEqual([]);
  });

  it("flies every part above the floor, and doors and handles round the carcass", () => {
    const motion = createMotion();
    const timeline = gsap.timeline({ paused: true });
    buildTimeline(timeline, motion);
    const position = new Vector3();
    const quaternion = new Quaternion();
    // The carcass from outside, 1 cm in: what a door or a handle must not enter.
    const carcass = {
      x: 0.59,
      bottom: 0.01,
      top: 1.99,
      back: -0.29,
      front: 0.29,
    };
    const wrong = new Map<string, string>();

    for (let sample = 0; sample <= SAMPLES; sample++) {
      const progress = sample / SAMPLES;
      timeline.progress(progress);
      PARTS.forEach((part, index) => {
        const { fly } = motion.parts[index];
        if (fly <= 0 || fly >= 1) return;
        placePart(part, motion.parts[index], position, quaternion);
        const goesRound = part.step >= 4;
        for (const x of [-1, -0.5, 0, 0.5, 1]) {
          for (const y of [-1, -0.5, 0, 0.5, 1]) {
            for (const z of [-1, 1]) {
              const point = new Vector3(
                (x * part.size[0]) / 2,
                (y * part.size[1]) / 2,
                (z * part.size[2]) / 2,
              )
                .applyQuaternion(quaternion)
                .add(position);
              if (point.y < -0.005) {
                wrong.set(
                  `${part.id} floor`,
                  `${part.id} under the floor at ${progress.toFixed(3)}`,
                );
              }
              const inside =
                Math.abs(point.x) < carcass.x &&
                point.y > carcass.bottom &&
                point.y < carcass.top &&
                point.z > carcass.back &&
                point.z < carcass.front;
              if (goesRound && inside) {
                wrong.set(
                  `${part.id} carcass`,
                  `${part.id} in the carcass at ${progress.toFixed(3)}`,
                );
              }
            }
          }
        }
      });
    }

    expect([...wrong.values()]).toEqual([]);
  });
});

describe("the finished wardrobe on a phone", () => {
  /** How much of the canvas the finished wardrobe takes across and up, 1 is all of it. */
  function shareOf(canvas: CanvasShape) {
    const motion = createMotion();
    const timeline = gsap.timeline({ paused: true });
    buildTimeline(timeline, motion);
    timeline.progress(1);
    const camera = cameraOn(canvas, motion.camera);
    const position = new Vector3();
    const quaternion = new Quaternion();
    const xs: number[] = [];
    const ys: number[] = [];
    PARTS.forEach((part, index) => {
      placePart(part, motion.parts[index], position, quaternion);
      for (const corner of cornersOf(part.size, position, quaternion)) {
        const seen = corner.project(camera);
        xs.push(seen.x);
        ys.push(seen.y);
      }
    });
    return {
      across: (Math.max(...xs) - Math.min(...xs)) / 2,
      up: (Math.max(...ys) - Math.min(...ys)) / 2,
    };
  }

  it("fills the canvas: three quarters of its width or nine tenths of its height", () => {
    const small = PHONE_ASPECTS.flatMap((aspect) => {
      const { across, up } = shareOf({ aspect, phone: true });
      return across >= 0.75 || up >= 0.9
        ? []
        : [`${aspect}: ${across.toFixed(2)} across, ${up.toFixed(2)} up`];
    });

    expect(small).toEqual([]);
  });

  it("is larger than on a computer window of the same shape", () => {
    for (const aspect of PHONE_ASPECTS) {
      const phone = shareOf({ aspect, phone: true });
      const computer = shareOf({ aspect, phone: false });
      expect(phone.up).toBeGreaterThanOrEqual(computer.up);
      expect(phone.across).toBeGreaterThanOrEqual(computer.across);
    }
  });
});
