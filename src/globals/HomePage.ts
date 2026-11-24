import type { GlobalConfig } from "payload";
import { anyone, authenticated } from "../collections/shared/access";
import { metaField } from "../collections/shared/fields";
import { revalidateSite } from "../hooks/revalidate-site";
import { exactRelations, exactRows } from "./validators";

export const FEATURED_PROJECTS = 3;
export const PROCESS_STEPS = 4;
export const SCENE_CAPTIONS = 6;
export const HERO_FACTS = 3;
export const ABOUT_PRINCIPLES = 3;
export const CAREERS_BENEFITS = 4;
export const CAREERS_FAQ = 4;

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Startseite",
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
          label: "Erster Bildschirm",
          fields: [
            {
              name: "hero",
              type: "group",
              label: "Erster Bildschirm",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Überschrift",
                  required: true,
                  localized: true,
                },
                {
                  name: "text",
                  type: "textarea",
                  label: "Text unter der Überschrift",
                  required: true,
                  localized: true,
                },
                {
                  name: "image",
                  type: "upload",
                  label: "Foto",
                  relationTo: "media",
                  required: true,
                  admin: {
                    description:
                      "Großes Querformat, etwa die Werkstatt oder eine fertige Küche.",
                  },
                },
                {
                  name: "facts",
                  type: "array",
                  label: "Fakten unter dem ersten Bildschirm",
                  maxRows: HERO_FACTS,
                  labels: {
                    singular: "Fakt",
                    plural: "Fakten",
                  },
                  admin: {
                    description:
                      "Bis zu drei kurze Zeilen, zum Beispiel „Meisterbetrieb“ + „seit 1989“. Ohne Einträge entfällt die Zeile.",
                  },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          name: "highlight",
                          type: "text",
                          label: "Fett gedruckt",
                          required: true,
                          localized: true,
                        },
                        {
                          name: "text",
                          type: "text",
                          label: "Rest der Zeile",
                          required: true,
                          localized: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Projekte und Ablauf",
          fields: [
            {
              name: "featuredProjects",
              type: "relationship",
              label: "Ausgewählte Projekte",
              relationTo: "projects",
              hasMany: true,
              required: true,
              minRows: FEATURED_PROJECTS,
              maxRows: FEATURED_PROJECTS,
              validate: exactRelations(
                FEATURED_PROJECTS,
                "Bitte genau drei Referenzen auswählen.",
              ),
              admin: {
                description:
                  "Genau drei Referenzen, in der Reihenfolge, in der sie erscheinen.",
              },
            },
            {
              name: "processSteps",
              type: "array",
              label: "So läuft Ihr Auftrag",
              required: true,
              minRows: PROCESS_STEPS,
              maxRows: PROCESS_STEPS,
              validate: exactRows(
                PROCESS_STEPS,
                "Bitte genau vier Schritte eintragen.",
              ),
              labels: {
                singular: "Schritt",
                plural: "Schritte",
              },
              admin: {
                description: "Genau vier Schritte, vom Aufmaß bis zur Montage.",
              },
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Überschrift",
                  required: true,
                  localized: true,
                },
                {
                  name: "text",
                  type: "textarea",
                  label: "Text",
                  required: true,
                  localized: true,
                },
              ],
            },
          ],
        },
        {
          label: "3D-Szene",
          fields: [
            {
              name: "sceneCaptions",
              type: "array",
              label: "Bildunterschriften „Vom Brett zum Schrank“",
              required: true,
              minRows: SCENE_CAPTIONS,
              maxRows: SCENE_CAPTIONS,
              validate: exactRows(
                SCENE_CAPTIONS,
                "Bitte genau sechs Bildunterschriften eintragen.",
              ),
              labels: {
                singular: "Bildunterschrift",
                plural: "Bildunterschriften",
              },
              admin: {
                description:
                  "Genau sechs, eine je Schritt der Szene: Zuschnitt, Korpus, Innenleben, Fronten, Montage, Fertig. Jede beginnt mit dem Namen des Schritts und einem Doppelpunkt oder Punkt, zum Beispiel „Zuschnitt: Jedes Teil …“. Der Name erscheint als Überschrift des Schritts.",
              },
              fields: [
                {
                  name: "text",
                  type: "text",
                  label: "Bildunterschrift",
                  required: true,
                  localized: true,
                },
              ],
            },
            {
              name: "sceneButton",
              type: "text",
              label: "Schaltfläche beim Schritt „Fertig“",
              required: true,
              localized: true,
              // Also the database default, so the column comes to a filled table.
              defaultValue: "Projekt anfragen",
              admin: {
                description:
                  "Erscheint, wenn der Schrank fertig ist, und führt zur Anfrage. Kurz halten, zum Beispiel „Projekt anfragen“.",
              },
            },
          ],
        },
        {
          label: "Über uns und Karriere",
          fields: [
            {
              name: "about",
              type: "group",
              label: "Block „Über uns“",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Überschrift",
                  required: true,
                  localized: true,
                },
                {
                  name: "text",
                  type: "textarea",
                  label: "Text",
                  required: true,
                  localized: true,
                  admin: {
                    description: "Absätze mit einer Leerzeile trennen.",
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  label: "Foto",
                  relationTo: "media",
                  admin: {
                    description:
                      "Die Werkstatt oder die Arbeit darin, ohne Personen, die in die Kamera schauen. Erscheint auf der Startseite und auf „Über uns“.",
                  },
                },
                {
                  name: "principles",
                  type: "array",
                  label: "So arbeiten wir",
                  maxRows: ABOUT_PRINCIPLES,
                  labels: {
                    singular: "Grundsatz",
                    plural: "Grundsätze",
                  },
                  admin: {
                    description:
                      "Drei kurze Grundsätze für die Seite „Über uns“. Ohne Einträge entfällt der Block.",
                  },
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      label: "Überschrift",
                      required: true,
                      localized: true,
                    },
                    {
                      name: "text",
                      type: "textarea",
                      label: "Text",
                      required: true,
                      localized: true,
                    },
                  ],
                },
              ],
            },
            {
              name: "careers",
              type: "group",
              label: "Block „Karriere“",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Überschrift",
                  required: true,
                  localized: true,
                },
                {
                  name: "text",
                  type: "textarea",
                  label: "Text",
                  required: true,
                  localized: true,
                  admin: {
                    description:
                      "Kurz über die Arbeit bei uns. Die offenen Stellen erscheinen darunter von selbst.",
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  label: "Foto",
                  relationTo: "media",
                  admin: {
                    description:
                      "Jemand bei der Arbeit in der Werkstatt. Erscheint auf der Startseite und auf „Karriere“.",
                  },
                },
                {
                  name: "benefits",
                  type: "array",
                  label: "Warum es sich bei uns gut arbeitet",
                  maxRows: CAREERS_BENEFITS,
                  labels: {
                    singular: "Punkt",
                    plural: "Punkte",
                  },
                  admin: {
                    description:
                      "Bis zu vier Punkte für die Seite „Karriere“, in der Du-Form. Ohne Einträge entfällt der Block.",
                  },
                  fields: [
                    {
                      name: "text",
                      type: "text",
                      label: "Punkt",
                      required: true,
                      localized: true,
                    },
                  ],
                },
                {
                  name: "faq",
                  type: "array",
                  label: "Häufige Fragen",
                  maxRows: CAREERS_FAQ,
                  labels: {
                    singular: "Frage",
                    plural: "Fragen",
                  },
                  admin: {
                    description:
                      "Drei bis vier Fragen für die Seite „Karriere“, etwa „Brauche ich einen Lebenslauf?“. Ohne Einträge entfällt der Block.",
                  },
                  fields: [
                    {
                      name: "question",
                      type: "text",
                      label: "Frage",
                      required: true,
                      localized: true,
                    },
                    {
                      name: "answer",
                      type: "textarea",
                      label: "Antwort",
                      required: true,
                      localized: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Suchmaschinen",
          fields: [metaField()],
        },
      ],
    },
  ],
};
