import type { CollectionConfig } from "payload";
import { publicRead } from "./shared/access";
import { orderField } from "./shared/fields";

export const Team: CollectionConfig = {
  slug: "team",
  labels: {
    singular: "Teammitglied",
    plural: "Team",
  },
  access: publicRead,
  defaultSort: "order",
  admin: {
    group: "Inhalte",
    useAsTitle: "name",
    defaultColumns: ["name", "role", "since", "order"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "role",
      type: "text",
      label: "Rolle",
      required: true,
      localized: true,
      admin: {
        description: "Zum Beispiel „Schreinerin“ oder „Azubi, 2. Lehrjahr“.",
      },
    },
    {
      name: "since",
      type: "number",
      label: "Im Betrieb seit (Jahr)",
      required: true,
      min: 1950,
      max: 2100,
    },
    orderField(),
  ],
};
