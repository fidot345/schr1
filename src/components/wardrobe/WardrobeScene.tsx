"use client";

/*
 * Client component, loaded on its own (next/dynamic, ssr: false) once the
 * section is one screen away: WebGL and the scroll exist only in the
 * browser, and three, fiber, drei and GSAP stay out of the first load.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { type RefObject, useRef, useState } from "react";
import {
  type Mesh,
  type MeshStandardMaterial,
  setConsoleFunction,
  Vector3,
} from "three";
import { Board } from "./Board";
import { CAMERA, PARTS, type PartMaterial, type SceneStep } from "./parts";
import {
  useWardrobeTimeline,
  type WardrobeMotion,
} from "./useWardrobeTimeline";

type WardrobeSceneProps = {
  /** The panel that stays on screen while the wardrobe is built. */
  pin: RefObject<HTMLElement | null>;
  /** Hears the step under way when it changes; a state setter. */
  onStep: (step: SceneStep) => void;
  /** Called once the canvas is ready to draw. */
  onReady: () => void;
};

/*
 * Settings of the canvas, BRIEF.md section 4 "Как это устроено технически"
 * and "Скорость". Constants, so a new render of the section does not hand
 * the canvas new objects (fiber would set the camera back to its start).
 */
const DPR: [number, number] = [1, 1.75];
const CAMERA_SETTINGS = {
  fov: CAMERA.fov,
  near: 0.1,
  far: 60,
  position: [...CAMERA.start] as [number, number, number],
};
/** A clear canvas: the page's Papier shows through. */
const GL = { alpha: true, antialias: true };
/** Wheel and touch go to the page: the scene follows only the scroll. */
const STYLE = { pointerEvents: "none" } as const;

const CAMERA_START = new Vector3(...CAMERA.start);
const CAMERA_END = new Vector3(...CAMERA.end);
const CAMERA_TARGET = new Vector3(...CAMERA.target);

/** The floor reaches far past the edges of the picture. */
const FLOOR_SIZE = 40;
/** Far away the floor fades into the page instead of ending in an edge. */
const FOG = { near: 6, far: 12 };
/** The wall of the room, just behind the back panel. */
const WALL = { width: 8, height: 4, z: -0.32 };

/*
 * fiber 9.8 still makes a THREE.Clock, and three r183 warns on the console
 * that Clock is deprecated, once per canvas. That one message is dropped;
 * everything else three reports goes to the console as before. Remove this
 * when fiber moves to THREE.Timer.
 */
const FIBER_CLOCK_WARNING = "THREE.Clock: This module has been deprecated.";
setConsoleFunction((type, message, ...params) => {
  if (type === "warn" && message.startsWith(FIBER_CLOCK_WARNING)) return;
  console[type](message, ...params);
});

/** A colour token of globals.css, as the page has it. */
const token = (name: string): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();

/**
 * The grey prototype, BRIEF.md section 4 "Порядок работы": tones of the
 * design instead of wood and metal, which come in the next step.
 */
function readColors() {
  const parts: Record<PartMaterial, string> = {
    oak: token("feldrand"),
    birch: token("linie"),
    metal: token("graphit"),
  };
  return {
    parts,
    floor: token("weiss"),
    fog: token("papier"),
    sky: token("weiss"),
    ground: token("linie"),
    wall: token("moos"),
  };
}

/** Step 5: the camera goes from above to three quarters at eye level. */
function CameraPath({ motion }: { motion: WardrobeMotion }) {
  useFrame(({ camera }) => {
    camera.position.lerpVectors(CAMERA_START, CAMERA_END, motion.camera);
    camera.lookAt(CAMERA_TARGET);
  });
  return null;
}

/** Step 6: the wall of the room comes up behind the wardrobe. */
function Wall({ motion, color }: { motion: WardrobeMotion; color: string }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);

  useFrame(() => {
    if (!mesh.current || !material.current) return;
    mesh.current.visible = motion.room > 0;
    material.current.opacity = motion.room;
  });

  return (
    <mesh ref={mesh} position={[0, WALL.height / 2, WALL.z]} visible={false}>
      <planeGeometry args={[WALL.width, WALL.height]} />
      <meshStandardMaterial
        ref={material}
        color={color}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

/**
 * "Vom Brett zum Schrank" as a grey prototype: the 16 parts, the camera,
 * a floor and plain light. A frame is drawn only when the timeline moves.
 * Hidden from assistive technology: the captions next to it tell the steps.
 */
export default function WardrobeScene({
  pin,
  onStep,
  onReady,
}: WardrobeSceneProps) {
  const motion = useWardrobeTimeline(pin, onStep);
  const [colors] = useState(readColors);

  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={DPR}
      camera={CAMERA_SETTINGS}
      gl={GL}
      style={STYLE}
      onCreated={onReady}
    >
      <CameraPath motion={motion} />
      <hemisphereLight
        color={colors.sky}
        groundColor={colors.ground}
        intensity={1.6}
      />
      <directionalLight color={colors.sky} position={[3, 5, 4]} intensity={2} />
      <fog attach="fog" args={[colors.fog, FOG.near, FOG.far]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color={colors.floor} />
      </mesh>
      {PARTS.map((part, index) => (
        <Board
          key={part.id}
          part={part}
          motion={motion.parts[index]}
          color={colors.parts[part.material]}
        />
      ))}
      <Wall motion={motion} color={colors.wall} />
    </Canvas>
  );
}
