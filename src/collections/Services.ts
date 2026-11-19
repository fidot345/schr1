import type { CollectionConfig } from "payload";
import { publicRead } from "./shared/access";
import {
  coverField,
  galleryField,
  metaField,
  orderField,
  slugField,
  textListField,
} from "./shared/fields";

export const Services: CollectionConfig = {
  slug: "services",
  labels: {
    singular: "Leistung",
    plural: "Leistungen",
  },
  access: publicRead,
  defaultSort: "order",
  admin: {
    group: "Inhalte",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "order", "updatedAt"],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Titel",
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: "summary",
      type: "text",
      label: "Kurztext",
      required: true,
      localized: true,
      admin: {
        description: "Eine Zeile für die Karte auf der Startseite.",
      },
    },
    {
      name: "intro",
      type: "textarea",
      label: "Einleitung",
      required: true,
      localized: true,
    },
    textListField({
      name: "included",
      label: "Was dazugehört",
      itemLabel: "Punkt",
    }),
    textListField({
      name: "materials",
      label: "Materialien",
      itemLabel: "Material",
    }),
    {
      name: "duration",
      type: "text",
      label: "Dauer",
      localized: true,
      admin: {
        description: "Zum Beispiel „8–10 Wochen vom Aufmaß bis zur Montage“.",
      },
    },
    coverField(),
    galleryField(),
    orderField(),
    metaField(),
  ],
};
