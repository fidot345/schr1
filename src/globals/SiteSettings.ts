import type { GlobalConfig } from "payload";
import { anyone, authenticated } from "../collections/shared/access";
import { revalidateSite } from "../hooks/revalidate-site";
import {
  sibling,
  validatePostalCode,
  validateVacationFrom,
  validateVacationUntil,
} from "./validators";

const dayOnly = {
  pickerAppearance: "dayOnly",
  displayFormat: "dd.MM.yyyy",
} as const;

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Website-Einstellungen",
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    group: "Einstellungen",
  },
  hooks: {
    afterChange: [revalidateSite],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Firma",
          fields: [
            {
              name: "company",
              type: "group",
              label: "Firmendaten",
              admin: {
                description:
                  "Erscheinen in Kopf- und Fußzeile, auf der Kontaktseite und im Impressum.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "name",
                      type: "text",
                      label: "Name der Firma",
                      required: true,
                    },
                    {
                      name: "owner",
                      type: "text",
                      label: "Inhaber",
                      required: true,
                    },
                  ],
                },
                {
                  name: "street",
                  type: "text",
                  label: "Straße und Hausnummer",
                  required: true,
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "postalCode",
                      type: "text",
                      label: "PLZ",
                      required: true,
                      validate: validatePostalCode,
                    },
                    {
                      name: "city",
                      type: "text",
                      label: "Ort",
                      required: true,
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "phone",
                      type: "text",
                      label: "Telefon",
                      required: true,
                      admin: {
                        description:
                          "So, wie die Nummer auf der Website stehen soll, zum Beispiel „089 99998 412“.",
                      },
                    },
                    {
                      name: "email",
                      type: "email",
                      label: "E-Mail",
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Öffnungszeiten und Gebiet",
          fields: [
            {
              name: "openingHours",
              type: "array",
              label: "Öffnungszeiten",
              required: true,
              minRows: 1,
              labels: {
                singular: "Zeile",
                plural: "Öffnungszeiten",
              },
              admin: {
                description:
                  "Eine Zeile je Zeitraum, in der richtigen Reihenfolge.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "days",
                      type: "text",
                      label: "Tage",
                      required: true,
                      localized: true,
                      admin: {
                        description: "Zum Beispiel „Mo–Do“.",
                      },
                    },
                    {
                      name: "hours",
                      type: "text",
                      label: "Uhrzeit",
                      required: true,
                      localized: true,
                      admin: {
                        description: "Zum Beispiel „7:00–16:30“.",
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: "serviceArea",
              type: "textarea",
              label: "Wo wir arbeiten",
              required: true,
              localized: true,
              admin: {
                description:
                  "Ein bis zwei Sätze für die Kontaktseite, zum Beispiel zum Umkreis von 40 km.",
              },
            },
          ],
        },
        {
          label: "Betriebsurlaub",
          fields: [
            {
              name: "vacation",
              type: "group",
              label: "Betriebsurlaub",
              admin: {
                description:
                  "Eingeschaltet erscheint auf allen Seiten ein Hinweis mit diesen Daten. Der Wortlaut des Hinweises ist fest auf der Website hinterlegt.",
              },
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  label: "Hinweis anzeigen",
                  defaultValue: false,
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "from",
                      type: "date",
                      label: "Von",
                      validate: validateVacationFrom,
                      admin: {
                        date: dayOnly,
                        condition: (_, siblingData) =>
                          sibling(siblingData, "enabled") === true,
                      },
                    },
                    {
                      name: "until",
                      type: "date",
                      label: "Bis",
                      validate: validateVacationUntil,
                      admin: {
                        date: dayOnly,
                        condition: (_, siblingData) =>
                          sibling(siblingData, "enabled") === true,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Rechtliches",
          fields: [
            {
              name: "imprint",
              type: "richText",
              label: "Impressum",
              required: true,
              localized: true,
            },
            {
              name: "privacy",
              type: "richText",
              label: "Datenschutzerklärung",
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
  ],
};
