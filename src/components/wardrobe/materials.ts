import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
} from "three";
import type { PartMaterial } from "./parts";

/*
 * The materials of the wardrobe, BRIEF.md section 4 "Материалы и свет":
 * oak with colour, roughness and normals, the light back panel, the metal
 * of the rail and the dark metal of the handles. The textures come from
 * our own domain (public/textures, sources in docs/credits.md); their grain
 * runs up the picture.
 */

/** Oak colour, oak roughness, oak normals, back panel colour. */
const TEXTURES = [
  "/textures/oak/color.webp",
  "/textures/oak/roughness.webp",
  "/textures/oak/normal.webp",
  "/textures/birch/color.webp",
];

/** How wide one tile of a wood texture is on the board, in metres, as Poly Haven gives it. */
export const TILE = { oak: 1.83, birch: 1 } as const;

export type Wood = keyof typeof TILE;
export const isWood = (material: PartMaterial): material is Wood =>
  material in TILE;

/** The relief of the oak, a little softer than the scan: veneer is sanded. */
const OAK_RELIEF = new Vector2(0.6, 0.6);
/** The back panel: plain, matt plywood. */
const BIRCH_ROUGHNESS = 0.7;
/**
 * Steel in Linie: the rail brushed, the handles polished a little more.
 * Not the brief's dark Graphit for the handles: metal that dark mirrors
 * next to no light and showed as black bars without a highlight (Maxon,
 * session 35).
 */
const METAL = { metalness: 0.9, roughness: 0.3 };
const POLISHED_METAL = { metalness: 0.9, roughness: 0.22 };
/** Sharper wood on the boards seen at a slant, within what phones handle. */
const MAX_ANISOTROPY = 8;

// The textures start loading as soon as the code of the scene is there,
// BRIEF.md "Загрузка". The same list as below: one entry in the cache.
useTexture.preload(TEXTURES);

/**
 * The four materials of the parts, made once and shared by all of them;
 * `metal` is the colour of rail and handles, a token of globals.css.
 * Suspends until the textures are loaded; gives everything back to the
 * graphics card when the scene goes.
 */
export function useWardrobeMaterials(
  metal: string,
): Record<PartMaterial, MeshStandardMaterial> {
  const gl = useThree((state) => state.gl);
  const textures = useTexture(TEXTURES);

  const materials = useMemo(() => {
    const [oakColor, oakRoughness, oakNormal, birchColor] = textures;
    const anisotropy = Math.min(
      gl.capabilities.getMaxAnisotropy(),
      MAX_ANISOTROPY,
    );
    for (const texture of textures) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
    // Colours are sRGB pictures; roughness and normals stay plain data.
    oakColor.colorSpace = SRGBColorSpace;
    birchColor.colorSpace = SRGBColorSpace;

    return {
      oak: new MeshStandardMaterial({
        map: oakColor,
        roughnessMap: oakRoughness,
        normalMap: oakNormal,
        normalScale: OAK_RELIEF,
      }),
      birch: new MeshStandardMaterial({
        map: birchColor,
        roughness: BIRCH_ROUGHNESS,
      }),
      metal: new MeshStandardMaterial({ color: metal, ...METAL }),
      "polished-metal": new MeshStandardMaterial({
        color: metal,
        ...POLISHED_METAL,
      }),
    };
  }, [gl, textures, metal]);

  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose();
      for (const texture of textures) texture.dispose();
    },
    [materials, textures],
  );

  return materials;
}
