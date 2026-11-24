import type gsap from "gsap";
import { PARTS, type PartMotion, type SceneStep, STEP_RANGES } from "./parts";

/*
 * The storyboard of BRIEF.md section 4 as one GSAP timeline: what moves in
 * which step. Kept apart from the scroll (useWardrobeTimeline), so tests can
 * play it through without a browser.
 */

/** Everything the timeline moves; the scene reads it on every frame. */
export type WardrobeMotion = {
  /** One per part, in the order of PARTS. */
  parts: PartMotion[];
  /** Step 5: from the view from above to three quarters at eye level. */
  camera: number;
  /** Step 5: the light goes from white to warm. */
  warmth: number;
  /** Step 6: wall and floor of the room come up. */
  room: number;
};

export const createMotion = (): WardrobeMotion => ({
  parts: PARTS.map(() => ({ lift: 0, fly: 0, swing: 0 })),
  camera: 0,
  warmth: 0,
  room: 0,
});

/** Up, across and gently down: the curve of the brief for every motion. */
const EASE = "power2.inOut";

const span = (step: SceneStep): [number, number] => {
  const { from, to } = STEP_RANGES[step - 1];
  return [from, to];
};

/**
 * Tweens `key` of each target from 0 to 1 within [from, to]. Each tween
 * takes `share` of the stretch and they start one after another, evenly
 * spread over the rest, so the last one ends at `to`.
 */
function inTurn<T extends object>(
  timeline: gsap.core.Timeline,
  targets: T[],
  key: keyof T & string,
  [from, to]: [number, number],
  share: number,
) {
  const length = to - from;
  const duration = targets.length > 1 ? length * share : length;
  const offset =
    targets.length > 1 ? (length - duration) / (targets.length - 1) : 0;
  targets.forEach((target, index) => {
    timeline.to(
      target,
      { [key]: 1, duration, ease: EASE },
      from + index * offset,
    );
  });
}

/** The motions of the parts that arrive in `step`, in the order of PARTS. */
const motionsOf = (motion: WardrobeMotion, step: SceneStep): PartMotion[] =>
  PARTS.flatMap((part, index) =>
    part.step === step ? [motion.parts[index]] : [],
  );

/** The motions of the parts in the stack; rail and handles lie beside it. */
const stackedOf = (motion: WardrobeMotion): PartMotion[] =>
  PARTS.flatMap((part, index) =>
    part.stack.layer === null ? [] : [motion.parts[index]],
  );

/**
 * The storyboard on a timeline exactly 1 long, so its time is the progress
 * of the pinned scroll.
 */
export function buildTimeline(
  timeline: gsap.core.Timeline,
  motion: WardrobeMotion,
) {
  const [doorsFrom, doorsTo] = span(4);

  // 1 Zuschnitt: the stack loosens, one layer after another from the top.
  inTurn(timeline, stackedOf(motion), "lift", span(1), 0.35);
  // 2 Korpus: sides, base, top and divider.
  inTurn(timeline, motionsOf(motion, 2), "fly", span(2), 0.5);
  // 3 Innenleben: shelves, rail and back panel.
  inTurn(timeline, motionsOf(motion, 3), "fly", span(3), 0.45);
  // 4 Fronten: the doors come in open, then close on their hinges.
  const doors = motionsOf(motion, 4);
  inTurn(timeline, doors, "fly", [doorsFrom, doorsFrom + 0.14], 0.75);
  inTurn(timeline, doors, "swing", [doorsFrom + 0.13, doorsTo], 0.7);
  // 5 Montage: the handles, the camera goes down to eye level and the
  // light warms.
  const [mountFrom, mountTo] = span(5);
  inTurn(
    timeline,
    motionsOf(motion, 5),
    "fly",
    [mountFrom, mountTo - 0.04],
    0.7,
  );
  inTurn(timeline, [motion], "camera", span(5), 1);
  inTurn(timeline, [motion], "warmth", span(5), 1);
  // 6 Fertig: the room around the wardrobe.
  inTurn(timeline, [motion], "room", span(6), 1);
}
