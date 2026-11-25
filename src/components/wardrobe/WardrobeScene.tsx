"use client";

/*
 * Client component, loaded on its own (next/dynamic, ssr: false) once the
 * section is one screen away: WebGL and the scroll exist only in the
 * browser, and three, fiber, drei and GSAP stay out of the first load.
 */

import { ContactShadows, Lightformer } from "@react-three/drei";
import {
  Canvas,
  createPortal,
  type GLProps,
  type RootState,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  Suspense,
  useCallback,
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
  WebGLRenderer,
} from "three";
import { Board } from "./Board";
import { grainOffset } from "./grain";
import { useWardrobeMaterials } from "./materials";
import { CAMERA, cameraAt, PARTS, type SceneStep } from "./parts";
import { isWeakDevice, qualityFor, REBUILDS } from "./quality";
import { Room } from "./Room";
import {
  reportRebuild,
  SceneBoundary,
  type SceneFailure,
  type SceneSetback,
} from "./scene-failure";
import type { WardrobeMotion } from "./storyboard";
import { useWardrobeTimeline, type WardrobePins } from "./useWardrobeTimeline";

type WardrobeSceneProps = {
  /** What stays on screen while the wardrobe is built: the panel, or on a phone the scene with its caption. */
  pins: WardrobePins;
  /** Hears the step under way when it changes; a state setter. */
  onStep: (step: SceneStep) => void;
  /** Called once the wardrobe with its textures is ready to draw, and again after each new build. */
  onReady: () => void;
  /** Called when the browser takes the WebGL context away: the scene waits to be built anew. */
  onLost: () => void;
  /** Called when the scene gives up: the still picture takes its place for good. */
  onFailure: (reason: SceneFailure, cause?: unknown) => void;
};

/*
 * Settings of the canvas, BRIEF.md section 4 "Как это устроено технически"
 * and "Скорость"; how sharp and how detailed it is comes from quality.ts.
 * Constants, so a new render of the section does not hand the canvas new
 * objects (fiber would set the camera back to its start).
 */
const CAMERA_SETTINGS = {
  fov: CAMERA.fov,
  near: 0.1,
  far: 60,
  position: [...CAMERA.start.position] as [number, number, number],
};
/** Wheel and touch go to the page: the scene follows only the scroll. */
const STYLE = { pointerEvents: "none" } as const;
/** Real shadows from the light, PCF with a soft radius (three's soft PCF is gone). */
const SHADOW_TYPE = "percentage";

/**
 * WebGL 2 is there (the section asked), but the renderer of the scene got
 * no context: too many contexts on the page, or none with these settings.
 * The scene is built anew, lighter.
 */
class NoContextError extends Error {}

/**
 * The renderer of one build: a clear canvas (the page's Papier shows
 * through), smooth edges only if `antialias`. Its failure to get a context
 * is told apart from every other error of the scene.
 */
const rendererFor =
  (antialias: boolean): GLProps =>
  (defaults) => {
    const { canvas } = defaults;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new NoContextError("The scene draws on a canvas of the page.");
    }
    try {
      return new WebGLRenderer({ ...defaults, canvas, alpha: true, antialias });
    } catch (cause) {
      throw new NoContextError("No WebGL 2 context for the scene.", { cause });
    }
  };
const RENDERERS = { smooth: rendererFor(true), plain: rendererFor(false) };

/**
 * Neutral tone mapping keeps the colours of wood and tokens as they are,
 * where ACES (fiber's default for a renderer it did not configure itself)
 * would darken and grey them.
 */
const toneMapNeutral = ({ gl }: RootState) => {
  gl.toneMapping = NeutralToneMapping;
};

/**
 * How long a lost context may take to come back while the page is in view,
 * in milliseconds. After that the scene is built anew on a new context.
 */
const RESTORE_WAIT = 3000;

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
const ENVIRONMENT = { ground: 0.3 };
/**
 * How strong the one light and the light all round are. With real shadows
 * (computer) the light leads and the inside of the carcass falls into its
 * shade; without them (phone, light scene) the soft light all round leads,
 * or the light would shine through the boards.
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
  opacity: 0.35,
  blur: 2.5,
  far: 2.6,
  renderOrder: 2,
};

/** A media query as a value of React that follows it. */
function mediaQuery(query: string) {
  return {
    subscribe: (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    matches: () => window.matchMedia(query).matches,
  };
}
/** Real shadows from the light on a computer only, BRIEF.md "Материалы и свет". */
const COMPUTER = mediaQuery("(width >= 48rem) and (pointer: fine)");
/** The phone layout of the section: the scene above one caption. */
const PHONE = mediaQuery("(width < 48rem)");

/** Each part takes its own piece of the wood texture. */
const GRAIN_OFFSETS = PARTS.map((_, index) => grainOffset(index));

/*
 * Two warnings of three are dropped; everything else three reports goes to
 * the console as before.
 * - fiber 9.8 still makes a THREE.Clock, and three r183 warns that Clock is
 *   deprecated, once per canvas. Remove this when fiber moves to
 *   THREE.Timer.
 * - When the context is lost for good, the section takes the scene down,
 *   and fiber asks the lost context to be lost once more: a lost context
 *   lends no extension, so three reports WEBGL_lose_context as missing.
 *   That would only muddle the warning that names the loss.
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
 * Step 5: the camera goes from above to three quarters at eye level, on a
 * phone nearer the wardrobe than on a computer. On a narrow canvas it
 * widens its field of view at the start, so the scene fits across.
 */
function CameraPath({
  motion,
  phone,
}: {
  motion: WardrobeMotion;
  phone: boolean;
}) {
  const [target] = useState(() => new Vector3());

  useFrame(({ camera, size }) => {
    const canvas = { aspect: size.width / size.height, phone };
    const fov = cameraAt(motion.camera, canvas, camera.position, target);
    if (camera instanceof PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
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
 * into a cube of `resolution` pixels a side that lights the wardrobe. It
 * does what drei's <Environment> does with children, without the HDR, EXR
 * and gain map loaders that <Environment> brings along: those alone would
 * take the 3D code over its 300 KB budget.
 */
function Surroundings({
  ground,
  intensity,
  resolution,
}: {
  ground: string;
  intensity: number;
  resolution: number;
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
    const target = new WebGLCubeRenderTarget(resolution);
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
 * Hears the browser take the WebGL context away and give it back. The
 * listeners go before fiber drops the context itself when the scene is
 * taken down.
 *
 * The scene is then built anew on a new canvas, so the context this one
 * gets back is given up again at once: what the old scene leaves behind is
 * freed while its context is lost, where that does nothing. On the restored
 * context three would delete the textures, buffers and render targets of
 * the lost one, and WebGL warns of each ("object does not belong to this
 * context").
 */
function ContextWatch({
  onLost,
  onRestored,
}: {
  onLost: () => void;
  onRestored: () => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const stop = () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
    function restored() {
      stop();
      // Not three's forceContextLoss: it would keep the extension, and
      // fiber's own call when the scene goes would lose the context twice.
      gl.getContext().getExtension("WEBGL_lose_context")?.loseContext();
      onRestored();
    }
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", restored);
    return stop;
  }, [gl, onLost, onRestored]);
  return null;
}

/** The 16 parts in their materials; suspends until the textures are there. */
function Wardrobe({
  motion,
  metal,
  shadows,
  textureSize,
  onReady,
}: {
  motion: WardrobeMotion;
  metal: string;
  shadows: boolean;
  textureSize: number;
  onReady: () => void;
}) {
  const materials = useWardrobeMaterials(metal, textureSize);

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
 *
 * The canvas is built anew when the browser takes its WebGL context away
 * (BRIEF.md "Запасной вариант", Maxon, session 37): once the context comes
 * back, or after RESTORE_WAIT in view, on a new canvas, one step lighter
 * (quality.ts). So it is when the renderer gets no context. The pin and
 * the timeline stay, so the window keeps its place in the story. After
 * REBUILDS new builds the next setback is the end: the still picture.
 */
export default function WardrobeScene({
  pins,
  onStep,
  onReady,
  onLost,
  onFailure,
}: WardrobeSceneProps) {
  const motion = useWardrobeTimeline(pins, onStep);
  const [colors] = useState(readColors);
  // Only a phone or tablet starts lighter: a computer of 4 cores still
  // draws the brief's scene, real shadows included.
  const [weak] = useState(() => !COMPUTER.matches() && isWeakDevice(navigator));
  const computer = useSyncExternalStore(
    COMPUTER.subscribe,
    COMPUTER.matches,
    COMPUTER.matches,
  );
  const phone = useSyncExternalStore(
    PHONE.subscribe,
    PHONE.matches,
    PHONE.matches,
  );

  // The number of the build: 0 the first one, then one more per setback.
  const [build, setBuild] = useState(0);
  const builds = useRef(0);
  const [lost, setLost] = useState(false);
  const waiting = useRef(false);

  const rebuild = useCallback(
    (reason: SceneSetback, cause?: unknown) => {
      waiting.current = false;
      if (builds.current >= REBUILDS) {
        onFailure(reason, cause);
        return;
      }
      builds.current += 1;
      reportRebuild(reason, builds.current, REBUILDS);
      setLost(false);
      setBuild(builds.current);
    },
    [onFailure],
  );

  const onContextLost = useCallback(() => {
    if (builds.current >= REBUILDS) {
      onFailure("context-lost");
      return;
    }
    waiting.current = true;
    setLost(true);
    onLost();
  }, [onFailure, onLost]);

  const buildAgain = useCallback(() => {
    if (waiting.current) rebuild("context-lost");
  }, [rebuild]);

  // A context that does not come back: a new one after a while in view.
  useEffect(() => {
    if (!lost) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") {
        timer = setTimeout(buildAgain, RESTORE_WAIT);
      }
    };
    wait();
    document.addEventListener("visibilitychange", wait);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wait);
    };
  }, [lost, buildAgain]);

  const onCanvasError = useCallback(
    (error: unknown) => {
      if (error instanceof NoContextError) rebuild("no-context", error);
      else onFailure("scene-error", error);
    },
    [rebuild, onFailure],
  );

  const quality = qualityFor(build, weak);
  const shadows = computer && quality.realShadows;
  const brightness = BRIGHTNESS[shadows ? "shadows" : "plain"];

  return (
    <SceneBoundary key={build} onError={onCanvasError}>
      <Canvas
        aria-hidden="true"
        frameloop="demand"
        dpr={quality.dpr}
        camera={CAMERA_SETTINGS}
        gl={quality.antialias ? RENDERERS.smooth : RENDERERS.plain}
        onCreated={toneMapNeutral}
        shadows={shadows ? SHADOW_TYPE : false}
        style={STYLE}
      >
        <ContextWatch onLost={onContextLost} onRestored={buildAgain} />
        <CameraPath motion={motion} phone={phone} />
        <Sun motion={motion} color={colors.light} shadows={shadows} />
        <Surroundings
          ground={colors.ground}
          intensity={brightness.surroundings}
          resolution={quality.environment}
        />
        <ContactShadows
          {...CONTACT_SHADOWS}
          resolution={quality.contactShadows}
          color={colors.shadow}
        />
        <Room motion={motion} colors={colors.room} />
        <Suspense fallback={null}>
          <Wardrobe
            motion={motion}
            metal={colors.metal}
            shadows={shadows}
            textureSize={quality.textureSize}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
