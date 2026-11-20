import type {
  ArrayField,
  FieldHook,
  GroupField,
  NumberField,
  TextField,
  TextFieldSingleValidation,
  UploadField,
} from "payload";
import { SLUG_PATTERN, slugify } from "../../lib/slugify";

const slugFromInputOrTitle: FieldHook = ({ value, siblingData }) => {
  if (typeof value === "string" && value.trim() !== "") {
    return slugify(value);
  }
  const title: unknown = siblingData?.title;
  if (typeof title === "string" && title.trim() !== "") {
    return slugify(title);
  }
  return value;
};

const validateSlug: TextFieldSingleValidation = (value) => {
  if (!value) {
    return "Bitte eine Adresse eintragen.";
  }
  return (
    SLUG_PATTERN.test(value) ||
    "Nur Kleinbuchstaben, Ziffern und Bindestriche, zum Beispiel „kuechen“."
  );
};

export const slugField = (): TextField => ({
  name: "slug",
  type: "text",
  label: "Adresse (Slug)",
  required: true,
  unique: true,
  localized: true,
  validate: validateSlug,
  hooks: {
    beforeValidate: [slugFromInputOrTitle],
  },
  admin: {
    position: "sidebar",
    description:
      "Letzter Teil der Seitenadresse, je Sprache eigen. Bleibt das Feld leer, entsteht er aus dem Titel.",
  },
});

export const orderField = (): NumberField => ({
  name: "order",
  type: "number",
  label: "Reihenfolge",
  min: 0,
  admin: {
    position: "sidebar",
    description: "Kleinere Zahl steht weiter vorn.",
  },
});

export const metaField = (): GroupField => ({
  name: "meta",
  type: "group",
  label: "Suchmaschinen",
  admin: {
    description:
      "Titel und Beschreibung für Google und Vorschauen in Messengern. Leer lassen, dann gilt der Titel der Seite.",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Titel",
      localized: true,
      maxLength: 70,
    },
    {
      name: "description",
      type: "textarea",
      label: "Beschreibung",
      localized: true,
      maxLength: 160,
    },
  ],
});

export const textListField = ({
  name,
  label,
  itemLabel,
  required = false,
}: {
  name: string;
  label: string;
  itemLabel: string;
  required?: boolean;
}): ArrayField => ({
  name,
  type: "array",
  label,
  localized: true,
  minRows: required ? 1 : undefined,
  required,
  labels: {
    singular: itemLabel,
    plural: label,
  },
  fields: [
    {
      name: "text",
      type: "text",
      label: itemLabel,
      required: true,
    },
  ],
});

export const coverField = (): UploadField => ({
  name: "cover",
  type: "upload",
  label: "Titelbild",
  relationTo: "media",
  required: true,
});

export const galleryField = (): UploadField => ({
  name: "gallery",
  type: "upload",
  label: "Galerie",
  relationTo: "media",
  hasMany: true,
});
