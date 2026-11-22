import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from "@payloadcms/richtext-lexical";
import type { GlobalConfig } from "payload";
import { anyone, authenticated } from "../collections/shared/access";
import { revalidateSite } from "../hooks/revalidate-site";
import {
  sibling,
  validateLogoWord,
  validatePostalCode,
  validateVacationFrom,
  validateVacationUntil,
} from "./validators";

/**
 * The editor of the legal texts: subheadings, paragraphs, lists and web
 * links, nothing else. No photos or uploads (they would not go through
 * next/image, AGENTS.md rule 5), no links to documents of the admin panel
 * (they have no address on the site). The page has the h1, so headings
 * start at h2. src/components/legal/LegalText.tsx renders exactly these.
 */
export const LEGAL_TEXT_FEATURES = [
  ParagraphFeature(),
  HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
  UnorderedListFeature(),
  OrderedListFeature(),
  LinkFeature({ enabledCollections: [] }),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
];

const legalTextEditor = lexicalEditor({ features: LEGAL_TEXT_FEATURES });

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
                  name: "logoWord",
                  type: "text",
                  label: "Wort im Logo",
                  // Required through validate, not `required`: a NOT NULL
                  // column could not be added to the existing settings row.
                  validate: validateLogoWord,
                  maxLength: 30,
                  admin: {
                    description:
                      "Steht neben dem Zeichen in der Kopfzeile, zum Beispiel „Tannrieder“. Gilt für beide Sprachen.",
                  },
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
            {
              name: "tagline",
              type: "text",
              label: "Zeile unter dem Logo im Fußbereich",
              localized: true,
              maxLength: 120,
              admin: {
                description:
                  "Ein kurzer Satz, zum Beispiel „Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.“ Bleibt das Feld leer, steht dort nichts.",
              },
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
                      admin: {
                        description:
                          "Zum Beispiel „7:00–16:30“, gilt für beide Sprachen.",
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
              editor: legalTextEditor,
            },
            {
              name: "privacy",
              type: "richText",
              label: "Datenschutzerklärung",
              required: true,
              localized: true,
              editor: legalTextEditor,
            },
          ],
        },
      ],
    },
  ],
};
