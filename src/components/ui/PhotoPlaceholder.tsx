import { cn } from "@/lib/cn";

/*
 * TEMP(stage-2): заменить на next/image + Media из Payload.
 * The photo stand-in of the mockup (.ph): a wood-colored striped surface with
 * a white caption. The colors live in globals.css (.photo-placeholder). It
 * goes away when the real photos come from Payload.
 *
 * oak:    the base tone, kitchens
 * birch:  light
 * walnut: dark
 * shop:   grey-brown, the workshop
 */
export type PhotoTone = "oak" | "birch" | "walnut" | "shop";

/** What the data of a photo carries: the tone, the text for assistive technology and the visible caption. */
export type PlaceholderPhoto = {
  tone: PhotoTone;
  alt: string;
  caption: string;
};

const TONE: Record<PhotoTone, string | undefined> = {
  oak: undefined,
  birch: "photo-placeholder-birch",
  walnut: "photo-placeholder-walnut",
  shop: "photo-placeholder-shop",
};

type PhotoPlaceholderProps = {
  photo: PlaceholderPhoto;
  /** Size and rounding of the frame: h-*, aspect-*, rounded-none. */
  className?: string;
};

export function PhotoPlaceholder({ photo, className }: PhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={photo.alt}
      className={cn("photo-placeholder", TONE[photo.tone], className)}
    >
      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded bg-weiss px-2.25 py-1.25 text-xs text-graphit md:bottom-4 md:left-4 md:max-w-[calc(100%-2rem)] md:px-2.5 md:py-1.5">
        {photo.caption}
      </span>
    </div>
  );
}
