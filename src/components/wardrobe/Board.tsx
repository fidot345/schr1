import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { type PartMotion, placePart, type WardrobePart } from "./parts";

/** The soft edge of every board, BRIEF.md section 4: 2 mm that catch the light. */
const EDGE = 0.002;
/** Segments round the hanging rail. */
const ROD_SEGMENTS = 24;

type BoardProps = {
  part: WardrobePart;
  /** Read on every frame: GSAP changes it, React does not. */
  motion: PartMotion;
  color: string;
};

/**
 * One part of the wardrobe: a board with soft edges, or the round rail.
 * Each frame puts it where its motion says, between stack and wardrobe.
 */
export function Board({ part, motion, color }: BoardProps) {
  const group = useRef<Group>(null);

  useFrame(() => {
    const object = group.current;
    if (object) placePart(part, motion, object.position, object.quaternion);
  });

  const [width, height, depth] = part.size;

  return (
    <group ref={group}>
      {part.shape === "rod" ? (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry
            args={[height / 2, height / 2, width, ROD_SEGMENTS]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
      ) : (
        <RoundedBox args={[width, height, depth]} radius={EDGE}>
          <meshStandardMaterial color={color} />
        </RoundedBox>
      )}
    </group>
  );
}
