import { useTranslations } from "next-intl";
import type { SceneCaption } from "@/lib/content";
import { Section } from "../Section";

type HomeSceneProps = {
  /** The six captions from the admin panel, in the scene's order. */
  captions: SceneCaption[];
};

/**
 * Place of the 3D scene "Vom Brett zum Schrank" (BRIEF.md section 4).
 * Until stage 5 it shows what the scene's fallback shows: the finished
 * wardrobe and all six captions as a list.
 *
 * PLACEHOLDER: public/images/3d/schrank-fertig.avif does not exist yet, so
 * the picture is an empty frame with a note. Replace it with the image
 * (next/image, alt text) once the file is there.
 */
export function HomeScene({ captions }: HomeSceneProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-scene" title={t("sceneTitle")} tone="moos">
      <div className="grid gap-8 md:grid-cols-12 md:items-center">
        <div
          data-placeholder="wardrobe-image"
          className="flex aspect-4/5 items-center justify-center rounded border border-linie bg-weiss p-8 md:col-span-5"
        >
          <p className="max-w-measure text-center text-schiefer">
            {t("scenePlaceholder")}
          </p>
        </div>
        <ol className="flex flex-col gap-6 md:col-span-7">
          {captions.map((caption, index) => (
            <li key={caption.id} className="flex gap-4">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 font-heading text-h4 font-semibold text-tannengruen"
              >
                {index + 1}
              </span>
              <p className="max-w-measure">{caption.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
