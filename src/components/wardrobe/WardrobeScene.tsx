"use client";

/*
 * Client component, loaded on its own (next/dynamic, ssr: false) once the
 * section is one screen away: WebGL and the scroll exist only in the
 * browser, and three, fiber, drei and GSAP stay out of the first load.
 */

import { ContactShadows, Lightformer } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  type RefObject,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Color,
  type CubeCamera,
  type DirectionalLight,
  HalfFloatType,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  setConsoleFunction,
  Vector3,
  WebGLCubeRenderTarget,
} from "three";
import { Board } from "./Board";
import { grainOffset } from "./grain";
import { useWardrobeMaterials } from "./materials";
import { CAMERA, cameraAt, fovFor, PARTS, type SceneStep } from "./parts";
import { Room } from "./Room";
import type { WardrobeMotion } from "./storyboard";
import { useWardrobeTimeline } from "./useWardrobeTimeline";

type WardrobeSceneProps = {
  /** The panel that stays on screen while the wardrobe is built. */
  pin: RefObject<HTMLElement | null>;
  /** Hears the step under way when it changes; a state setter. */
  onStep: (step: SceneStep) => void;
  /** Called once the wardrobe with its textures is ready to draw. */
  onReady: () => void;
  /** Called when the browser takes the WebGL context away while the scene runs. */
  onContextLost: () => void;
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
  position: [...CAMERA.start.position] as [number, number, number],
};
/**
 * A clear canvas: the page's Papier shows through. Neutral tone mapping
 * keeps the colours of wood and tokens as they are, where ACES (fiber's
 * default) would darken and grey them.
 */
const GL = { alpha: true, antialias: true, toneMapping: NeutralToneMapping };
/** Wheel and touch go to the page: the scene follows only the scroll. */
const STYLE = { pointerEvents: "none" } as const;
/** Real shadows from the light, PCF with a soft radius (three's soft PCF is gone). */
const SHADOW_TYPE = "percentage";

/**
 * The one soft light, BRIEF.md "Материалы и свет": high in front, to the
 * right, as from a window. Its shadow covers the stack and the wardrobe.
 */
const SUN = {
  position: [3, 5, 4] as const,
  shadow: {
    mapSize: [2048, 2048] as const,
    // left, right, top, bottom, near, far of its shadow camera.
    camera: [-2.6, 2.6, 2.6, -2.6, 1, 14] as const,
    bias: -0.0002,
    normalBias: 0.004,
    radius: 4,
  },
};
/** Step 5: the light warms from white to this, BRIEF.md "Материалы и свет". */
const WARM_LIGHT = "#ffe8cc";
/**
 * The light all round, from soft panels: brighter above, a window on the
 * right, a dimmer one on the left, over a soft grey (a share of Papier)
 * that keeps the shade sides and the metal from going black.
 */
const ENVIRONMENT = { resolution: 256, ground: 0.3 };
/**
 * How strong the one light and the light all round are. With real shadows
 * (computer) the light leads and the inside of the carcass falls into its
 * shade; without them (phone) the soft light all round leads, or the light
 * would shine through the boards.
 */
const BRIGHTNESS = {
  shadows: { sun: 2.6, surroundings: 0.7 },
  plain: { sun: 1.8, surroundings: 1.05 },
};
/**
 * Soft shadows on the floor under the wardrobe, the stack and every part
 * in flight, BRIEF.md "Материалы и свет". drei blurs them on a plane at the
 * origin, seen by a camera at `position`: so the plane stays centred at
 * x = z = 0, just under the floor. 4.4 m cover the stack behind on the
 * left, the wardrobe and the ways round it.
 */
const CONTACT_SHADOWS = {
  position: [0, -0.001, 0] as const,
  scale: 4.4,
  resolution: 512,
  opacity: 0.35,
  blur: 2.5,
  far: 2.6,
  renderOrder: 2,
};

/** Real shadows from the light on a computer only, BRIEF.md "Материалы и свет". */
const COMPUTER = "(width >= 48rem) and (pointer: fine)";
const subscribeToComputer = (onChange: () => void) => {
  const query = window.matchMedia(COMPUTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const onComputer = () => window.matchMedia(COMPUTER).matches;

/** Each part takes its own piece of the wood texture. */
const GRAIN_OFFSETS = PARTS.map((_, index) => grainOffset(index));

/*
 * Two warnings of three are dropped; everything else three reports goes to
 * the console as before.
 * - fiber 9.8 still makes a THREE.Clock, and three r183 warns that Clock is
 *   deprecated, once per canvas. Remove this when fiber moves to
 *   THREE.Timer.
 * - When the context is lost, the section takes the scene down, and fiber
 *   asks the lost context to be lost once more: a lost context lends no
 *   extension, so three reports WEBGL_lose_context as missing. That would
 *   only muddle the warning of the section that names the loss.
 */
const DROPPED_WARNINGS = [
  "THREE.Clock: This module has been deprecated.",
  "THREE.WebGLRenderer: WEBGL_lose_context extension not supported.",
];
setConsoleFunction((type, message, ...params) => {
  if (
    type === "warn" &&
    DROPPED_WARNINGS.some((warning) => message.startsWith(warning))
  ) {
    return;
  }
  console[type](message, ...params);
});

/** A colour token of globals.css, as the page has it. */
const token = (name: string): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();

/** The colours of the scene, from the tokens of the design. */
function readColors() {
  return {
    metal: token("linie"),
    light: token("weiss"),
    shadow: token("graphit"),
    ground: token("papier"),
    room: { wall: token("moos"), floor: token("linie") },
  };
}

/**
 * Step 5: the camera goes from above to three quarters at eye level. On a
 * narrow canvas it widens its field of view, so the scene fits across.
 */
function CameraPath({ motion }: { motion: WardrobeMotion }) {
  const [target] = useState(() => new Vector3());

  useFrame(({ camera, size }) => {
    if (camera instanceof PerspectiveCamera) {
      const fov = fovFor(size.width / size.height);
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
    cameraAt(motion.camera, camera.position, target);
    camera.lookAt(target);
  });
  return null;
}

/** The one light; it warms in step 5 and casts real shadows on a computer. */
function Sun({
  motion,
  color,
  shadows,
}: {
  motion: WardrobeMotion;
  color: string;
  shadows: boolean;
}) {
  const light = useRef<DirectionalLight>(null);
  const [colors] = useState(() => ({
    white: new Color(color),
    warm: new Color(WARM_LIGHT),
  }));

  useFrame(() => {
    light.current?.color.lerpColors(colors.white, colors.warm, motion.warmth);
  });

  return (
    <directionalLight
      ref={light}
      position={SUN.position}
      intensity={BRIGHTNESS[shadows ? "shadows" : "plain"].sun}
      castShadow={shadows}
      shadow-mapSize={SUN.shadow.mapSize}
      shadow-bias={SUN.shadow.bias}
      shadow-normalBias={SUN.shadow.normalBias}
      shadow-radius={SUN.shadow.radius}
    >
      <orthographicCamera attach="shadow-camera" args={SUN.shadow.camera} />
    </directionalLight>
  );
}

/**
 * Light from all round without an HDR file, BRIEF.md "Материалы и свет":
 * soft panels (drei's Lightformer) in a scene of their own, drawn once
 * into a cube that lights the wardrobe. It does what drei's <Environment>
 * does with children, without the HDR, EXR and gain map loaders that
 * <Environment> brings along: those alone would take the 3D code over its
 * 300 KB budget.
 */
function Surroundings({
  ground,
  intensity,
}: {
  ground: string;
  intensity: number;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useRef<CubeCamera>(null);
  const [panels] = useState(() => {
    const room = new Scene();
    room.background = new Color(ground).multiplyScalar(ENVIRONMENT.ground);
    return room;
  });
  const [cube] = useState(() => {
    const target = new WebGLCubeRenderTarget(ENVIRONMENT.resolution);
    target.texture.type = HalfFloatType;
    return target;
  });

  // After the panels (children) have taken their place and brightness.
  useLayoutEffect(() => {
    camera.current?.update(gl, panels);
    scene.environment = cube.texture;
    return () => {
      scene.environment = null;
    };
  }, [gl, scene, panels, cube]);

  useLayoutEffect(() => {
    scene.environmentIntensity = intensity;
  }, [scene, intensity]);

  useEffect(() => () => cube.dispose(), [cube]);

  return createPortal(
    <>
      <Lightformer position={[0, 6, 0]} scale={[10, 10, 1]} intensity={1.2} />
      <Lightformer position={[5, 2.5, 5]} scale={[4, 3, 1]} intensity={2} />
      <Lightformer position={[-6, 2, 1]} scale={[5, 4, 1]} intensity={0.7} />
      <cubeCamera ref={camera} args={[0.1, 100, cube]} />
    </>,
    panels,
  );
}

/**
 * Hears the loss of the WebGL context, BRIEF.md "Запасной вариант". three
 * would draw again after a restore, but without the light all round (its
 * cube is drawn once) the wood came back dark: the section shows the still
 * picture instead. The listener goes before fiber drops the context itself
 * when the scene is taken down.
 */
function ContextLoss({ onLost }: { onLost: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [canvas, onLost]);
  return null;
}

/** The 16 parts in their materials; suspends until the textures are there. */
function Wardrobe({
  motion,
  metal,
  shadows,
  onReady,
}: {
  motion: WardrobeMotion;
  metal: string;
  shadows: boolean;
  onReady: () => void;
}) {
  const materials = useWardrobeMaterials(metal);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return PARTS.map((part, index) => (
    <Board
      key={part.id}
      part={part}
      motion={motion.parts[index]}
      material={materials[part.material]}
      grainOffset={GRAIN_OFFSETS[index]}
      shadows={shadows}
    />
  ));
}

/**
 * "Vom Brett zum Schrank": the 16 parts in oak, maple and metal, soft light
 * from all round and one light that warms in step 5, soft shadows on the
 * floor, the room in step 6. A frame is drawn only when the timeline moves.
 * Hidden from assistive technology: the captions next to it tell the steps.
 */
export default function WardrobeScene({
  pin,
  onStep,
  onReady,
  onContextLost,
}: WardrobeSceneProps) {
  const motion = useWardrobeTimeline(pin, onStep);
  const [colors] = useState(readColors);
  const shadows = useSyncExternalStore(
    subscribeToComputer,
    onComputer,
    onComputer,
  );

  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={DPR}
      camera={CAMERA_SETTINGS}
      gl={GL}
      shadows={shadows ? SHADOW_TYPE : false}
      style={STYLE}
    >
      <ContextLoss onLost={onContextLost} />
      <CameraPath motion={motion} />
      <Sun motion={motion} color={colors.light} shadows={shadows} />
      <Surroundings
        ground={colors.ground}
        intensity={BRIGHTNESS[shadows ? "shadows" : "plain"].surroundings}
      />
      <ContactShadows {...CONTACT_SHADOWS} color={colors.shadow} />
      <Room motion={motion} colors={colors.room} />
      <Suspense fallback={null}>
        <Wardrobe
          motion={motion}
          metal={colors.metal}
          shadows={shadows}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}
