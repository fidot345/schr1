import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { layGrain } from "./grain";
import { isWood, TILE } from "./materials";
import { EDGE, type PartMotion, placePart, type WardrobePart } from "./parts";

/** Segments round the hanging rail. */
const ROD_SEGMENTS = 24;

type BoardProps = {
  part: WardrobePart;
  /** Read on every frame: GSAP changes it, React does not. */
  motion: PartMotion;
  /** Shared by all parts of the same material. */
  material: MeshStandardMaterial;
  /** Where on the wood texture this part takes its piece from, in tiles. */
  grainOffset: readonly [number, number];
  /** Casts and takes real shadows from the light (computer only). */
  shadows: boolean;
};

/**
 * One part of the wardrobe: a board with soft edges, or the round rail.
 * Each frame puts it where its motion says, between stack and wardrobe.
 */
export function Board({
  part,
  motion,
  material,
  grainOffset,
  shadows,
}: BoardProps) {
  const group = useRef<Group>(null);
  const board = useRef<Mesh>(null);

  useFrame(() => {
    const object = group.current;
    if (object) placePart(part, motion, object.position, object.quaternion);
  });

  // RoundedBox centres its geometry in an effect of its own, which runs
  // before this one (children first): the grain goes on the centred board.
  useLayoutEffect(() => {
    const mesh = board.current;
    if (!mesh || !isWood(part.material)) return;
    layGrain(mesh.geometry, part.size, TILE[part.material], grainOffset);
  }, [part, grainOffset]);

  const [width, height, depth] = part.size;

  return (
    <group ref={group}>
      {part.shape === "rod" ? (
        <mesh
          rotation={[0, 0, Math.PI / 2]}
          material={material}
          castShadow={shadows}
          receiveShadow={shadows}
        >
          <cylinderGeometry
            args={[height / 2, height / 2, width, ROD_SEGMENTS]}
          />
        </mesh>
      ) : (
        <RoundedBox
          ref={board}
          args={[width, height, depth]}
          radius={part.edge ?? EDGE}
          material={material}
          castShadow={shadows}
          receiveShadow={shadows}
        />
      )}
    </group>
  );
}
