import type {
  CollectionConfig,
  DateFieldValidation,
  NumberFieldSingleValidation,
  SelectFieldSingleValidation,
} from "payload";
import { revalidateSiteHooks } from "../hooks/revalidate-site";
import { publicRead } from "./shared/access";
import {
  metaField,
  orderField,
  slugField,
  textListField,
} from "./shared/fields";

const sibling = (data: unknown, key: string): unknown =>
  typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)[key]
    : undefined;

const validatePayMax: NumberFieldSingleValidation = (
  value,
  { siblingData },
) => {
  const payMin = sibling(siblingData, "payMin");
  if (typeof value !== "number" || typeof payMin !== "number") {
    return true;
  }
  return value >= payMin || "Darf nicht kleiner als „Lohn von“ sein.";
};

const validatePayUnit: SelectFieldSingleValidation = (
  value,
  { siblingData },
) => {
  const hasPay =
    typeof sibling(siblingData, "payMin") === "number" ||
    typeof sibling(siblingData, "payMax") === "number";
  return !hasPay || Boolean(value) || "Bitte angeben, wofür der Lohn gilt.";
};

const validateValidThrough: DateFieldValidation = (value, { siblingData }) => {
  const datePosted = sibling(siblingData, "datePosted");
  if (!value || !datePosted) {
    return true;
  }
  return (
    new Date(value) >= new Date(String(datePosted)) ||
    "Darf nicht vor dem Veröffentlichungsdatum liegen."
  );
};

export const Jobs: CollectionConfig = {
  slug: "jobs",
  labels: {
    singular: "Stelle",
    plural: "Karriere",
  },
  access: publicRead,
  hooks: revalidateSiteHooks,
  defaultSort: "order",
  admin: {
    group: "Inhalte",
    useAsTitle: "title",
    defaultColumns: ["title", "employmentType", "active", "order", "updatedAt"],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Titel",
      required: true,
      localized: true,
      admin: {
        description: "Zum Beispiel „Schreiner (m/w/d)“.",
      },
    },
    slugField(),
    {
      name: "active",
      type: "checkbox",
      label: "Stelle ist offen",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "employmentType",
      type: "select",
      label: "Art der Stelle",
      required: true,
      options: [
        { label: "Vollzeit", value: "full_time" },
        { label: "Teilzeit", value: "part_time" },
        { label: "Ausbildung", value: "apprenticeship" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "start",
          type: "text",
          label: "Start",
          required: true,
          localized: true,
          admin: {
            description: "Zum Beispiel „ab sofort“ oder „September 2027“.",
          },
        },
        {
          name: "hours",
          type: "text",
          label: "Arbeitszeit",
          required: true,
          localized: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "payMin",
          type: "number",
          label: "Lohn von (€)",
          min: 0,
        },
        {
          name: "payMax",
          type: "number",
          label: "Lohn bis (€)",
          min: 0,
          validate: validatePayMax,
        },
        {
          name: "payUnit",
          type: "select",
          label: "Lohn gilt",
          validate: validatePayUnit,
          options: [
            { label: "pro Stunde", value: "hour" },
            { label: "pro Monat", value: "month" },
          ],
        },
      ],
    },
    {
      name: "payText",
      type: "text",
      label: "Lohn als Text",
      localized: true,
      admin: {
        description:
          "Wenn eine Spanne nicht passt, etwa bei der Ausbildung: „1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 €“.",
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
      name: "tasks",
      label: "Deine Aufgaben",
      itemLabel: "Aufgabe",
      required: true,
    }),
    textListField({
      name: "requirements",
      label: "Was du mitbringst",
      itemLabel: "Punkt",
      required: true,
    }),
    textListField({
      name: "benefits",
      label: "Was wir bieten",
      itemLabel: "Punkt",
      required: true,
    }),
    {
      name: "datePosted",
      type: "date",
      label: "Veröffentlicht am",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly", displayFormat: "dd.MM.yyyy" },
      },
    },
    {
      name: "validThrough",
      type: "date",
      label: "Gültig bis",
      validate: validateValidThrough,
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly", displayFormat: "dd.MM.yyyy" },
        description: "Leer lassen, wenn die Stelle offen bleibt.",
      },
    },
    orderField(),
    metaField(),
  ],
};
