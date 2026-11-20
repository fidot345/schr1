import type { CollectionConfig } from "payload";
import { revalidateSiteHooks } from "../hooks/revalidate-site";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Benutzer",
    plural: "Benutzer",
  },
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  hooks: revalidateSiteHooks,
  fields: [],
};
