/*
 * Demo data for /dev/ui only. On the real pages these values come from
 * Payload (SiteSettings, stage 2). Nothing else may import this file:
 * tests/unit/dev-ui.test.tsx checks that.
 */

import type {
  CompanyContact,
  OpeningHoursEntry,
} from "@/components/layout/Footer";

/** The company legend, BRIEF.md section 2. */
export const DEMO_COMPANY: CompanyContact = {
  name: "Schreinerei Tannrieder",
  street: "Werkstattweg 4",
  postalCode: "85999",
  city: "Wendelfing",
  phone: "089 99998 412",
  email: "info@tannrieder.example",
};

/** The logo word, as brandWord() takes it from the company name. */
export const DEMO_BRAND_NAME = "Tannrieder";

export const DEMO_OPENING_HOURS: OpeningHoursEntry[] = [
  { days: "Mo–Do", hours: "7:00–16:30" },
  { days: "Fr", hours: "7:00–12:00" },
];

/** Holiday between the years, as ISO dates like Payload stores them. */
export const DEMO_VACATION = {
  from: "2026-12-23",
  to: "2027-01-06",
};

/**
 * The color tokens from globals.css. Full class names, so Tailwind finds
 * them in this file; the values themselves live only in @theme.
 */
export const DEMO_COLORS = [
  { name: "Papier", token: "--color-papier", swatch: "bg-papier" },
  { name: "Weiß", token: "--color-weiss", swatch: "bg-weiss" },
  { name: "Graphit", token: "--color-graphit", swatch: "bg-graphit" },
  { name: "Schiefer", token: "--color-schiefer", swatch: "bg-schiefer" },
  { name: "Linie", token: "--color-linie", swatch: "bg-linie" },
  { name: "Feldrand", token: "--color-feldrand", swatch: "bg-feldrand" },
  {
    name: "Tannengrün",
    token: "--color-tannengruen",
    swatch: "bg-tannengruen",
  },
  {
    name: "Tannengrün dunkel",
    token: "--color-tannengruen-dunkel",
    swatch: "bg-tannengruen-dunkel",
  },
  { name: "Moos", token: "--color-moos", swatch: "bg-moos" },
  { name: "Fehler", token: "--color-fehler", swatch: "bg-fehler" },
] as const;
