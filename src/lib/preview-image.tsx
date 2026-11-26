import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { PREVIEW_SIZE, type PreviewContent } from "./preview";

/*
 * The preview image for messengers and social networks, 1200 x 630, as in
 * BRIEF.md section 5: drawn by code (next/og) in the site's colors, with
 * Zilla Slab from a local file (src/assets/fonts, SIL Open Font License).
 * The logo row from the header on Papier, the page's title and a line
 * under it, a Tannengrün strip along the bottom.
 */

/**
 * The colors of the design tokens in src/app/(frontend)/globals.css. The
 * image is drawn outside the page, where the CSS variables do not exist,
 * so the values are copied; tests/unit/preview-image.test.tsx keeps them
 * equal to the tokens.
 */
export const PREVIEW_COLORS = {
  papier: "#f8f9f7",
  graphit: "#24282a",
  schiefer: "#5b6266",
  tannengruen: "#1f4537",
  moos: "#e4ebe6",
} as const;

/** The one radius of the design, --radius: 4px. */
const RADIUS = 4;

const FONT_FAMILY = "Zilla Slab";

const SEMI_BOLD_PATH = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "ZillaSlab-SemiBold.ttf",
);
const BOLD_PATH = path.join(
  process.cwd(),
  "src",
  "assets",
  "fonts",
  "ZillaSlab-Bold.ttf",
);
/** The mark of the logo, the same file as the favicon's (src/app/favicon.ico/route.ts). */
const MARK_PATH = path.join(process.cwd(), "public", "images", "logo-mark.svg");

/** The mark is 30 x 34; here it is as high as the two lines next to it. */
const MARK_HEIGHT = 68;
const MARK_WIDTH = Math.round((MARK_HEIGHT * 30) / 34);

type Assets = {
  semiBold: Buffer;
  bold: Buffer;
  /** The mark as a data URL. */
  mark: string;
};

let assets: Promise<Assets> | undefined;

/** Fonts and mark, read once per server; a failed read is tried again next time. */
const loadAssets = (): Promise<Assets> => {
  assets ??= Promise.all([
    readFile(SEMI_BOLD_PATH),
    readFile(BOLD_PATH),
    readFile(MARK_PATH, "base64"),
  ]).then(
    ([semiBold, bold, mark]) => ({
      semiBold,
      bold,
      mark: `data:image/svg+xml;base64,${mark}`,
    }),
    (error: unknown) => {
      assets = undefined;
      throw error;
    },
  );
  return assets;
};

type PreviewProps = PreviewContent & { mark: string };

function Preview({
  descriptor,
  logoWord,
  eyebrow,
  title,
  subtitle,
  mark,
}: PreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 32,
        width: "100%",
        height: "100%",
        padding: "56px 80px 72px",
        backgroundColor: PREVIEW_COLORS.papier,
        fontFamily: FONT_FAMILY,
        fontWeight: 600,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* biome-ignore lint/performance/noImgElement: next/og draws the image; next/image does not exist there. */}
        <img src={mark} width={MARK_WIDTH} height={MARK_HEIGHT} alt="" />
        {logoWord ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.05,
                color: PREVIEW_COLORS.schiefer,
              }}
            >
              {descriptor}
            </div>
            <div
              style={{
                fontSize: 48,
                lineHeight: 1.05,
                color: PREVIEW_COLORS.tannengruen,
              }}
            >
              {logoWord}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: RADIUS,
              backgroundColor: PREVIEW_COLORS.moos,
              color: PREVIEW_COLORS.tannengruen,
              fontSize: 28,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: "block",
            lineClamp: 3,
            textWrap: "pretty",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.08,
            color: PREVIEW_COLORS.graphit,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "block",
              lineClamp: 2,
              textWrap: "pretty",
              fontSize: 30,
              lineHeight: 1.3,
              color: PREVIEW_COLORS.schiefer,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 24,
          backgroundColor: PREVIEW_COLORS.tannengruen,
        }}
      />
    </div>
  );
}

/** The PNG of one preview image. */
export async function previewImageResponse(
  content: PreviewContent,
): Promise<ImageResponse> {
  const { semiBold, bold, mark } = await loadAssets();

  return new ImageResponse(<Preview {...content} mark={mark} />, {
    ...PREVIEW_SIZE,
    fonts: [
      { name: FONT_FAMILY, data: semiBold, weight: 600, style: "normal" },
      { name: FONT_FAMILY, data: bold, weight: 700, style: "normal" },
    ],
  });
}
