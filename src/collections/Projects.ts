import type { CollectionConfig } from "payload";
import { publicRead } from "./shared/access";
import {
  coverField,
  galleryField,
  metaField,
  orderField,
  slugField,
} from "./shared/fields";

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: "Referenz",
    plural: "Referenzen",
  },
  access: publicRead,
  defaultSort: "order",
  admin: {
    group: "Inhalte",
    useAsTitle: "title",
    defaultColumns: ["title", "service", "year", "order", "updatedAt"],
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
      name: "service",
      type: "relationship",
      label: "Leistung",
      relationTo: "services",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "objectType",
          type: "text",
          label: "Objekt",
          required: true,
          localized: true,
          admin: {
            description: "Zum Beispiel „Einfamilienhaus“, ohne Adresse.",
          },
        },
        {
          name: "year",
          type: "number",
          label: "Jahr",
          required: true,
          min: 1989,
          max: 2100,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "duration",
          type: "text",
          label: "Dauer",
          required: true,
          localized: true,
          admin: {
            description: "Zum Beispiel „9 Wochen“.",
          },
        },
        {
          name: "material",
          type: "text",
          label: "Material",
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: "challenge",
      type: "textarea",
      label: "Die Aufgabe",
      required: true,
      localized: true,
    },
    {
      name: "solution",
      type: "textarea",
      label: "Unsere Lösung",
      required: true,
      localized: true,
    },
    coverField(),
    galleryField(),
    orderField(),
    metaField(),
  ],
};
