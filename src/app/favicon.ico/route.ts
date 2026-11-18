import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { packIco } from "@/lib/ico";

/*
 * Next.js accepts only a real .ico file for the `favicon` convention.
 * This handler builds it from the logo mark at build time,
 * so replacing public/images/logo-mark.svg updates /favicon.ico too.
 */
export const dynamic = "force-static";

const SIZES = [16, 32, 48];
const MARK_PATH = path.join(process.cwd(), "public", "images", "logo-mark.svg");

export async function GET(): Promise<Response> {
  const svg = await readFile(MARK_PATH);
  const images = await Promise.all(
    SIZES.map(async (size) => ({
      size,
      png: new Uint8Array(
        await sharp(svg, { density: 72 * (size / 16) })
          .resize(size, size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
      ),
    })),
  );

  return new Response(packIco(images), {
    headers: { "Content-Type": "image/x-icon" },
  });
}
