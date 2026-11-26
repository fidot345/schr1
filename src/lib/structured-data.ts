import type { CompanyData, OpeningHoursRow } from "./content";
import { telHref } from "./phone";

/*
 * Markup for Google (JSON-LD), BRIEF.md section 5: the workshop as a
 * HomeAndConstructionBusiness on the home and contact pages, and the
 * BreadcrumbList of the inner pages. The JobPosting of a job is in
 * job-posting.ts. Everything comes from SiteSettings and the pages; a field
 * the admin panel has no data for is left out, never made up.
 */

/** schema.org's days, Monday first. */
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type Day = (typeof DAYS)[number];

/** The names of the days in the admin panel's two languages, by schema.org's index. */
const DAY_NAMES: readonly (readonly string[])[] = [
  ["montag", "monday"],
  ["dienstag", "tuesday"],
  ["mittwoch", "wednesday"],
  ["donnerstag", "thursday"],
  ["freitag", "friday"],
  ["samstag", "saturday"],
  ["sonntag", "sunday"],
];

/** "Mo", "Do.", "Thu" or "Freitag": the index of the day, or -1. */
const dayIndex = (word: string): number => {
  const name = word.trim().replace(/\.$/, "").toLowerCase();
  if (name.length < 2) return -1;
  return DAY_NAMES.findIndex((names) =>
    names.some((full) => full.startsWith(name)),
  );
};

const DASH = /\s*[–—-]\s*/;

/**
 * The days of a row of opening hours, as the footer shows them: "Mo–Do",
 * "Fr", "Mo, Mi, Fr" or "Mon–Thu". null when a part is no day.
 */
export const parseDays = (text: string): Day[] | null => {
  const days: Day[] = [];
  for (const part of text.split(",")) {
    const ends = part.split(DASH).map(dayIndex);
    if (ends.length > 2 || ends.some((index) => index < 0)) return null;
    const [from = 0, to = from] = ends;
    // A range may run over Sunday: "Sa–Mo".
    for (let index = from; ; index = (index + 1) % DAYS.length) {
      days.push(DAYS[index]);
      if (index === to) break;
    }
  }
  return days.length > 0 ? [...new Set(days)] : null;
};

/** "7:00", "7.00", "07:00" or "7": "07:00"; null for no time of day. */
const time = (hours: string, minutes = "00"): string | null => {
  const h = Number(hours);
  const m = Number(minutes);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const HOURS =
  /^(\d{1,2})(?:[:.](\d{2}))?\s*(?:Uhr)?\s*[–—-]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:Uhr|h)?$/i;

/** "7:00–16:30" or "7–12 Uhr": opening and closing time; null when it is no span. */
export const parseHours = (
  text: string,
): { opens: string; closes: string } | null => {
  const match = HOURS.exec(text.trim());
  if (!match) return null;
  const [, openHour = "", openMinute, closeHour = "", closeMinute] = match;
  const opens = time(openHour, openMinute);
  const closes = time(closeHour, closeMinute);
  return opens && closes ? { opens, closes } : null;
};

/**
 * The opening hours of SiteSettings for Google. The rows are free text; a
 * row that does not read as days and a span of time ("nach Vereinbarung")
 * is left out rather than guessed.
 */
export const openingHoursSpecification = (
  rows: readonly Pick<OpeningHoursRow, "days" | "hours">[],
) =>
  rows.flatMap((row) => {
    const dayOfWeek = parseDays(row.days);
    const span = parseHours(row.hours);
    return dayOfWeek && span
      ? [{ "@type": "OpeningHoursSpecification", dayOfWeek, ...span }]
      : [];
  });

/** The parts of the address SiteSettings has; null when it has none. */
const postalAddress = (
  company: Pick<CompanyData, "street" | "postalCode" | "city">,
) =>
  company.street || company.postalCode || company.city
    ? {
        "@type": "PostalAddress",
        ...(company.street ? { streetAddress: company.street } : {}),
        ...(company.postalCode ? { postalCode: company.postalCode } : {}),
        ...(company.city ? { addressLocality: company.city } : {}),
        // The workshop is in Upper Bavaria (BRIEF.md section 2).
        addressRegion: "Bayern",
        addressCountry: "DE",
      }
    : null;

export type LocalBusinessSource = {
  company: Pick<
    CompanyData,
    "name" | "street" | "postalCode" | "city" | "phone" | "email"
  >;
  openingHours: readonly Pick<OpeningHoursRow, "days" | "hours">[];
  /** "Wo wir arbeiten", in paragraphs; the first one says where. */
  serviceArea: readonly string[];
};

/**
 * The workshop for Google, BRIEF.md section 5: name, address, phone,
 * opening hours and where it works, plus the site's address and its
 * preview image. null without a company name: there is nothing to name.
 */
export function buildLocalBusiness(
  { company, openingHours, serviceArea }: LocalBusinessSource,
  site: { url: string; image: string },
) {
  if (!company.name) return null;

  const telephone = telHref(company.phone)?.slice("tel:".length);
  const address = postalAddress(company);
  const hours = openingHoursSpecification(openingHours);
  const area = serviceArea[0];

  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: company.name,
    url: site.url,
    image: site.image,
    ...(telephone ? { telephone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(address ? { address } : {}),
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(area ? { areaServed: area } : {}),
  };
}

/** A step of the breadcrumb trail: its name and its absolute URL. */
export type Crumb = { name: string; url: string };

/** The BreadcrumbList of a page, from the home page down to the page itself. */
export const buildBreadcrumbList = (trail: readonly Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(({ name, url }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: url,
  })),
});
