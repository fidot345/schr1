/*
 * The six steps of "Vom Brett zum Schrank", BRIEF.md section 4
 * "Раскадровка": which stretch of the pinned scroll each one takes. Apart
 * from parts.ts, which needs three: the section imports the steps at once,
 * and three may come only with the lazy scene.
 */

/** The six steps of the scene, from "Zuschnitt" to "Fertig". */
export type SceneStep = 1 | 2 | 3 | 4 | 5 | 6;

/** The storyboard: the stretch of the pinned scroll (0 to 1) each step takes. */
export const STEP_RANGES: readonly {
  step: SceneStep;
  from: number;
  to: number;
}[] = [
  { step: 1, from: 0, to: 0.15 },
  { step: 2, from: 0.15, to: 0.4 },
  { step: 3, from: 0.4, to: 0.55 },
  { step: 4, from: 0.55, to: 0.75 },
  { step: 5, from: 0.75, to: 0.9 },
  { step: 6, from: 0.9, to: 1 },
];

/** The step that is under way at this progress of the scroll. */
export function stepAt(progress: number): SceneStep {
  const range = STEP_RANGES.find(({ to }) => progress < to);
  return range?.step ?? 6;
}
