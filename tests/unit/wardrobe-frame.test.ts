import gsap from "gsap";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  CAMERA,
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
 * canvas the page gives the scene.
 */

/**
 * Width over height of the canvas, as measured on the home page: a tablet
 * standing upright (768 × 1024), tall and wide windows, phones from 430 ×
 * 932 to 360 × 640.
 */
const CANVASES = [0.46, 0.54, 0.66, 0.75, 0.9, 1.23, 1.74];
/** A part keeps this far from the edges (1 is the edge of the canvas). */
const INSIDE = 0.97;
/** Points of the scroll checked, evenly from 0 to 1. */
const SAMPLES = 400;

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

describe("the storyboard", () => {
  it("keeps every part in the picture all the way, on every canvas", () => {
    const motion = createMotion();
    const timeline = gsap.timeline({ paused: true });
    buildTimeline(timeline, motion);
    const position = new Vector3();
    const quaternion = new Quaternion();
    const target = new Vector3();
    const outside = new Map<string, string>();

    for (let sample = 0; sample <= SAMPLES; sample++) {
      const progress = sample / SAMPLES;
      timeline.progress(progress);

      for (const aspect of CANVASES) {
        const camera = new PerspectiveCamera(fovFor(aspect), aspect, 0.1, 60);
        cameraAt(motion.camera, camera.position, target);
        camera.lookAt(target);
        camera.updateMatrixWorld();

        PARTS.forEach((part, index) => {
          placePart(part, motion.parts[index], position, quaternion);
          for (const corner of cornersOf(part.size, position, quaternion)) {
            const seen = corner.project(camera);
            const key = `${part.id} at ${aspect}`;
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
