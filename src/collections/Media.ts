import type { CollectionConfig, TextFieldSingleValidation } from "payload";
import { protectUsedMedia } from "../hooks/protect-used-media";
import { revalidateSiteHooks } from "../hooks/revalidate-site";
import { publicRead } from "./shared/access";

const validateSource: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true;
  }
  return (
    /^https:\/\/\S+$/.test(value) ||
    "Bitte eine vollständige Adresse mit https:// eintragen."
  );
};

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Medium",
    plural: "Medien",
  },
  access: publicRead,
  hooks: {
    ...revalidateSiteHooks,
    beforeDelete: [protectUsedMedia],
  },
  admin: {
    group: "Inhalte",
    useAsTitle: "alt",
    defaultColumns: ["filename", "alt", "license", "updatedAt"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alternativtext",
      required: true,
      localized: true,
      admin: {
        description:
          "Beschreibt, was auf dem Bild zu sehen ist – für Screenreader und wenn das Bild nicht lädt.",
      },
    },
    {
      name: "credit",
      type: "text",
      label: "Urheber",
      admin: {
        description: "Name der Fotografin oder des Fotografen.",
      },
    },
    {
      name: "source",
      type: "text",
      label: "Quelle",
      validate: validateSource,
      admin: {
        description: "Link zur Seite, von der das Bild stammt.",
      },
    },
    {
      name: "license",
      type: "select",
      label: "Lizenz",
      required: true,
      options: [
        { label: "Unsplash", value: "unsplash" },
        { label: "Pexels", value: "pexels" },
        { label: "CC0", value: "cc0" },
        { label: "Eigenes Foto", value: "own" },
      ],
    },
  ],
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    focalPoint: true,
    imageSizes: [
      { name: "w960", width: 960 },
      { name: "w1600", width: 1600 },
      { name: "w2400", width: 2400 },
    ],
  },
};
