import { BufferAttribute, type BufferGeometry, Vector3 } from "three";
import type { Vec3 } from "./parts";

/*
 * How the wood grain lies on a board, BRIEF.md section 4 "Материалы и свет":
 * along its long side, so the sides, the divider and the doors have it
 * upright and the base, the top and the shelves across. The textures have
 * their grain running up the picture (v).
 */

type Axis = 0 | 1 | 2;

/** The axis of the longest side of a board: the grain runs along it. */
export function grainAxis([width, height, depth]: Vec3): Axis {
  if (height >= width && height >= depth) return 1;
  return width >= depth ? 0 : 2;
}

/**
 * Where on the texture the n-th part takes its wood from, in tiles. Steps
 * of the golden ratio spread the parts evenly over the picture.
 */
export const grainOffset = (n: number): [number, number] => [
  (n * 0.618034) % 1,
  (n * 0.381966 + 0.5) % 1,
];

const a = new Vector3();
const b = new Vector3();
const c = new Vector3();

/** The axis a triangle faces most, from its three corners. */
function facing(): Axis {
  const normal = c.sub(b).cross(a.sub(b));
  const x = Math.abs(normal.x);
  const y = Math.abs(normal.y);
  const z = Math.abs(normal.z);
  if (x >= y && x >= z) return 0;
  return y >= z ? 1 : 2;
}

/**
 * Gives a board of `size` its texture coordinates: on every face the grain
 * (v) along the long side of the board and the other side across (u), in
 * tiles of a texture `tile` metres wide. `offset` (in tiles) moves the
 * picture, so boards of the same size do not show the same wood.
 *
 * Each triangle is projected along the axis it faces; the 2 mm round edges
 * get the projection of the side next to them.
 */
export function layGrain(
  geometry: BufferGeometry,
  size: Vec3,
  tile: number,
  offset: readonly [number, number],
): void {
  const position = geometry.getAttribute("position");
  const grain = grainAxis(size);
  const uv = new Float32Array(position.count * 2);
  const corner = [0, 0, 0];

  // The geometry has no index: every three points are one triangle.
  for (let first = 0; first + 2 < position.count; first += 3) {
    a.fromBufferAttribute(position, first);
    b.fromBufferAttribute(position, first + 1);
    c.fromBufferAttribute(position, first + 2);
    const face = facing();
    // On the end of a board the grain comes out of the face: any side will do.
    const along: Axis = face === grain ? (((face + 1) % 3) as Axis) : grain;
    const across = (3 - face - along) as Axis;

    for (let point = first; point < first + 3; point++) {
      corner[0] = position.getX(point);
      corner[1] = position.getY(point);
      corner[2] = position.getZ(point);
      uv[point * 2] = corner[across] / tile + offset[0];
      uv[point * 2 + 1] = corner[along] / tile + offset[1];
    }
  }

  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}
