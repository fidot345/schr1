import { Component, type ReactNode } from "react";

/*
 * What goes wrong with the 3D scene and what the console of the phone
 * (remote debugging) says about it, BRIEF.md section 4 "Запасной вариант".
 * Every message starts with "[wardrobe-scene]" and a code.
 */

/**
 * Why the still picture stands in for the scene for good. Reduced motion is
 * not one: that is a setting, not a failure.
 */
export type SceneFailure =
  /** The browser gives no WebGL 2 context, the only kind three.js draws with. */
  | "no-webgl2"
  /** WebGL 2 is there, but no context for the scene, not even a light one. */
  | "no-context"
  /**
   * The browser took the context away again and again while the scene ran:
   * a phone short of graphics memory, a reset of the GPU.
   */
  | "context-lost"
  /** The 3D code or the textures did not load, or the scene threw. */
  | "scene-error";

/** A failure the scene recovers from by building itself anew, lighter. */
export type SceneSetback = Extract<SceneFailure, "no-context" | "context-lost">;

const PREFIX = "[wardrobe-scene]";

/** One warning per failure, with its code first and what caused it after it. */
export function reportFailure(reason: SceneFailure, cause?: unknown) {
  const message = `${PREFIX} ${reason}: the still picture stands in for the 3D scene.`;
  if (cause === undefined) console.warn(message);
  else console.warn(message, cause);
}

/** A warning each time the scene is built anew: `rebuild` of `of`. */
export function reportRebuild(
  reason: SceneSetback,
  rebuild: number,
  of: number,
) {
  console.warn(
    `${PREFIX} ${reason}: the scene is built anew, lighter (${rebuild} of ${of}).`,
  );
}

/**
 * Not a warning: the system asks for less motion (on Android "Remove
 * animations", or the animation scales off), so the still picture is
 * there by design. Said on the console all the same, as it looks the same
 * as a failure on the phone.
 */
export function reportReducedMotion() {
  console.info(
    `${PREFIX} reduced-motion: the still picture, as the system asks for less motion.`,
  );
}

type SceneBoundaryProps = {
  /** Hears what went wrong; the parent decides what comes instead. */
  onError: (error: unknown) => void;
  children: ReactNode;
};

/**
 * Catches what goes wrong while the scene loads or draws: the import of its
 * code, the WebGL renderer that cannot be made, a texture that does not
 * come, an error in a frame. fiber passes errors of the canvas on to here.
 * Shows nothing once it has caught one.
 */
export class SceneBoundary extends Component<
  SceneBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
