import type { Locale } from "@/i18n/routing";
import type { SiteContent } from "@/lib/content";

/*
 * TEMP(stage-2): из SiteSettings в Payload.
 * Company data for the header, the footer and the vacation banner, while the
 * redesign takes no data from Payload (docs/REDESIGN.md, rule 6). The shape
 * is that of getSiteSettings in src/lib/content.ts, plus the footer tagline,
 * which has no field in SiteSettings yet.
 */

export type DemoSite = SiteContent & {
  /** The line under the logo in the footer. */
  tagline: string;
};

const COMPANY = {
  name: "Schreinerei Tannrieder",
  logoWord: "Tannrieder",
  owner: "Johannes Tannrieder",
  street: "Werkstattweg 4",
  postalCode: "85999",
  city: "Wendelfing",
  phone: "089 99998 412",
  email: "info@tannrieder.example",
} as const;

const DEMO_SITE: Record<Locale, DemoSite> = {
  de: {
    company: COMPANY,
    tagline: "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
    openingHours: [
      { id: "weekdays", days: "Mo–Do", hours: "7:00–16:30" },
      { id: "friday", days: "Fr", hours: "7:00–12:00" },
    ],
    vacation: null,
  },
  en: {
    company: COMPANY,
    tagline: "Joinery with its own workshop in Wendelfing, since 1989.",
    openingHours: [
      { id: "weekdays", days: "Mon–Thu", hours: "7:00–16:30" },
      { id: "friday", days: "Fri", hours: "7:00–12:00" },
    ],
    vacation: null,
  },
};

export const getDemoSite = (locale: Locale): DemoSite => DEMO_SITE[locale];
