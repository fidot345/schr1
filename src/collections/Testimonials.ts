import type { CollectionConfig } from "payload";
import { revalidateSiteHooks } from "../hooks/revalidate-site";
import { publicRead } from "./shared/access";
import { orderField } from "./shared/fields";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: {
    singular: "Kundenstimme",
    plural: "Kundenstimmen",
  },
  access: publicRead,
  hooks: revalidateSiteHooks,
  defaultSort: "order",
  admin: {
    group: "Inhalte",
    useAsTitle: "author",
    defaultColumns: ["author", "project", "order"],
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      label: "Zitat",
      required: true,
      localized: true,
    },
    {
      name: "author",
      type: "text",
      label: "Von",
      required: true,
      localized: true,
      admin: {
        description: "Zum Beispiel „Familie K., Einfamilienhaus“.",
      },
    },
    {
      name: "project",
      type: "relationship",
      label: "Referenz",
      relationTo: "projects",
      admin: {
        description: "Freiwillig: zu welcher Arbeit die Stimme gehört.",
      },
    },
    orderField(),
  ],
};
