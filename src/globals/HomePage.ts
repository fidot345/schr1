import type { GlobalConfig } from "payload";
import { anyone, authenticated } from "../collections/shared/access";
import { metaField } from "../collections/shared/fields";
import { revalidateSite } from "../hooks/revalidate-site";
import { exactRelations, exactRows } from "./validators";

export const FEATURED_PROJECTS = 3;
export const PROCESS_STEPS = 4;
export const SCENE_CAPTIONS = 6;

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
                  "Genau sechs, eine je Schritt der Szene: Zuschnitt, Korpus, Innenleben, Fronten, Montage, Fertig.",
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
