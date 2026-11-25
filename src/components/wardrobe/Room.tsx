import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import {
  DataTexture,
  type Group,
  LinearFilter,
  MeshBasicMaterial,
  Vector2,
} from "three";
import type { WardrobeMotion } from "./storyboard";

/*
 * Step 6 "Fertig", BRIEF.md section 4: the wall (Moos) and the floor of a
 * room come up round the finished wardrobe. They show their token colours
 * as they are, without light, and fade out towards their edges and towards
 * the edges of the canvas: the room melts into the page (Papier) instead
 * of ending in a hard frame. Right round the wardrobe the wall is a little
 * darker, its soft shadow drawn into the wall, and so is the corner where
 * wall meets floor.
 */

/** The wall, just behind the back panel; x from −w/2 to w/2, y from the floor up. */
const WALL = { width: 5, height: 3, z: -0.32 };
/**
 * The floor, from the wall to the front, 2 mm below the contact shadows:
 * under them, and out of sight of the camera that draws them from below.
 */
const FLOOR = { width: 5, depth: 3, y: -0.002 };
/** Room fully there within these distances of the wardrobe, gone at the plane's edge. */
const SOLID = { side: 2, top: 2.6, front: 1.8 };
/** The wardrobe's outline on the wall and how far its shadow reaches round it. */
const WARDROBE = { halfWidth: 0.6, height: 2 };
const HALO = { reach: 0.14, depth: 0.2 };
/** The corner where wall meets floor is a touch darker too. */
const CORNER = { reach: 0.35, depth: 0.08 };
/** Texels per metre of the fade and shade pictures: soft gradients only. */
const DENSITY = 32;
/** The band along each edge of the canvas in which the room fades out, as a share of it. */
const SCREEN_EDGE = 0.12;

/** 1 up to `from`, 0 from `to` on, smooth between. */
const fade = (from: number, to: number, value: number): number => {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return 1 - t * t * (3 - 2 * t);
};

/**
 * A picture over a plane `width` × `height` metres: brightness in the
 * colour channels (a factor on the material colour), how much of the room
 * is there in alpha. `at` gets the point in metres, from the plane's
 * bottom left corner, and returns [brightness, alpha].
 */
function roomTexture(
  width: number,
  height: number,
  at: (x: number, y: number) => [number, number],
): DataTexture {
  const columns = Math.round(width * DENSITY);
  const rows = Math.round(height * DENSITY);
  const data = new Uint8Array(columns * rows * 4);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const [shade, alpha] = at(
        ((column + 0.5) / columns) * width,
        ((row + 0.5) / rows) * height,
      );
      const index = (row * columns + column) * 4;
      data[index] = data[index + 1] = data[index + 2] = Math.round(shade * 255);
      data[index + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new DataTexture(data, columns, rows);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** The wall: full behind the wardrobe, fading to the sides and the top. */
function wallTexture(): DataTexture {
  return roomTexture(WALL.width, WALL.height, (x, y) => {
    const fromCentre = Math.abs(x - WALL.width / 2);
    // Distance from the outline of the wardrobe, 0 behind it.
    const outside = Math.hypot(
      Math.max(fromCentre - WARDROBE.halfWidth, 0),
      Math.max(y - WARDROBE.height, 0),
    );
    const shade =
      (1 - HALO.depth * fade(0, HALO.reach, outside)) *
      (1 - CORNER.depth * fade(0, CORNER.reach, y));
    const alpha =
      fade(SOLID.side, WALL.width / 2, fromCentre) *
      fade(SOLID.top, WALL.height, y);
    return [shade, alpha];
  });
}

/** The floor: full at the wall and under the wardrobe, fading to the sides and the front. */
function floorTexture(): DataTexture {
  return roomTexture(FLOOR.width, FLOOR.depth, (x, y) => {
    // y runs from the front edge (0) to the wall.
    const fromWall = FLOOR.depth - y;
    const shade = 1 - CORNER.depth * fade(0, CORNER.reach, fromWall);
    const alpha =
      fade(SOLID.side, FLOOR.width / 2, Math.abs(x - FLOOR.width / 2)) *
      fade(SOLID.front, FLOOR.depth, fromWall);
    return [shade, alpha];
  });
}

type CanvasSize = { value: Vector2 };

/**
 * A plane of the room: its token colour times its picture, not lit and not
 * tone mapped, fading out in a band along the edges of the canvas.
 */
function roomMaterial(
  color: string,
  map: DataTexture,
  canvasSize: CanvasSize,
): MeshBasicMaterial {
  const material = new MeshBasicMaterial({
    color,
    map,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.canvasSize = canvasSize;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec2 canvasSize;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
        [
          "vec2 onCanvas = gl_FragCoord.xy / canvasSize;",
          `vec2 edges = smoothstep(0.0, ${SCREEN_EDGE.toFixed(2)}, onCanvas) * smoothstep(0.0, ${SCREEN_EDGE.toFixed(2)}, 1.0 - onCanvas);`,
          "diffuseColor.a *= edges.x * edges.y;",
          "#include <opaque_fragment>",
        ].join("\n"),
      );
  };
  material.customProgramCacheKey = () => "wardrobe-room";
  return material;
}

type RoomProps = {
  motion: WardrobeMotion;
  /** Token colours of wall and floor. */
  colors: { wall: string; floor: string };
};

/** Wall and floor, coming up with `motion.room`. */
export function Room({ motion, colors }: RoomProps) {
  const gl = useThree((state) => state.gl);
  const [room] = useState(() => {
    const canvasSize: CanvasSize = { value: new Vector2(1, 1) };
    return {
      canvasSize,
      wall: roomMaterial(colors.wall, wallTexture(), canvasSize),
      floor: roomMaterial(colors.floor, floorTexture(), canvasSize),
    };
  });
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(
    () => () => {
      for (const material of [room.wall, room.floor]) {
        material.map?.dispose();
        material.dispose();
      }
    },
    [room],
  );

  useFrame(() => {
    if (!group) return;
    group.visible = motion.room > 0;
    room.wall.opacity = motion.room;
    room.floor.opacity = motion.room;
    // gl_FragCoord counts pixels of the drawing buffer.
    room.canvasSize.value.set(gl.domElement.width, gl.domElement.height);
  });

  return (
    <group ref={setGroup} visible={false}>
      <mesh position={[0, WALL.height / 2, WALL.z]} material={room.wall}>
        <planeGeometry args={[WALL.width, WALL.height]} />
      </mesh>
      <mesh
        position={[0, FLOOR.y, WALL.z + FLOOR.depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={room.floor}
      >
        <planeGeometry args={[FLOOR.width, FLOOR.depth]} />
      </mesh>
    </group>
  );
}
