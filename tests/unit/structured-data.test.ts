import { afterEach, describe, expect, it, vi } from "vitest";
import { breadcrumbs, localBusiness } from "@/i18n/json-ld";
import {
  buildBreadcrumbList,
  buildLocalBusiness,
  type LocalBusinessSource,
  openingHoursSpecification,
  parseDays,
  parseHours,
} from "@/lib/structured-data";

vi.mock("next-intl/server", () => import("./support/translations"));
vi.mock("@/i18n/navigation", () => import("./support/navigation"));
// json-ld.ts reads only the paths of the preview images from preview.ts.
vi.mock("@/lib/content", () => ({}));

const SITE = "https://schr1.vercel.app";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** SiteSettings as seed/data.ts fills them. */
const CONTACT: LocalBusinessSource = {
  company: {
    name: "Schreinerei Tannrieder",
    street: "Werkstattweg 4",
    postalCode: "85999",
    city: "Wendelfing",
    phone: "089 99998 412",
    email: "info@tannrieder.example",
  },
  openingHours: [
    { days: "Mo–Do", hours: "7:00–16:30" },
    { days: "Fr", hours: "7:00–12:00" },
  ],
  serviceArea: [
    "Wir arbeiten im Umkreis von etwa 40 km um Wendelfing.",
    "Zweiter Absatz.",
  ],
};

const EMPTY: LocalBusinessSource = {
  company: {
    name: "",
    street: null,
    postalCode: null,
    city: null,
    phone: null,
    email: null,
  },
  openingHours: [],
  serviceArea: [],
};

const SITE_LINKS = { url: `${SITE}/`, image: `${SITE}/de/og/site.png` };

describe("opening hours", () => {
  it.each([
    ["Mo–Do", ["Monday", "Tuesday", "Wednesday", "Thursday"]],
    ["Fr", ["Friday"]],
    ["Mon–Thu", ["Monday", "Tuesday", "Wednesday", "Thursday"]],
    ["Fri", ["Friday"]],
    ["Mo, Mi, Fr", ["Monday", "Wednesday", "Friday"]],
    ["Di - Do.", ["Tuesday", "Wednesday", "Thursday"]],
    ["Samstag", ["Saturday"]],
    ["Sa–Mo", ["Saturday", "Sunday", "Monday"]],
  ])("reads the days %j", (text, days) => {
    expect(parseDays(text)).toEqual(days);
  });

  it.each(["nach Vereinbarung", "Montags", "Feiertage", "M", ""])(
    "reads no days in %j",
    (text) => {
      expect(parseDays(text)).toBeNull();
    },
  );

  it.each([
    ["7:00–16:30", { opens: "07:00", closes: "16:30" }],
    ["7:00 – 12:00 Uhr", { opens: "07:00", closes: "12:00" }],
    ["07.30-17.00", { opens: "07:30", closes: "17:00" }],
    ["8–12 Uhr", { opens: "08:00", closes: "12:00" }],
  ])("reads the hours %j", (text, span) => {
    expect(parseHours(text)).toEqual(span);
  });

  it.each(["geschlossen", "7:00", "25:00–26:00", "7:75–12:00"])(
    "reads no hours in %j",
    (text) => {
      expect(parseHours(text)).toBeNull();
    },
  );

  it("gives Google the rows it can read and leaves out the others", () => {
    expect(
      openingHoursSpecification([
        ...CONTACT.openingHours,
        { days: "Sa", hours: "nach Vereinbarung" },
      ]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "07:00",
        closes: "16:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday"],
        opens: "07:00",
        closes: "12:00",
      },
    ]);
  });
});

describe("HomeAndConstructionBusiness", () => {
  it("has name, address, phone, opening hours and where it works", () => {
    expect(buildLocalBusiness(CONTACT, SITE_LINKS)).toEqual({
      "@context": "https://schema.org",
      "@type": "HomeAndConstructionBusiness",
      name: "Schreinerei Tannrieder",
      url: `${SITE}/`,
      image: `${SITE}/de/og/site.png`,
      telephone: "+498999998412",
      email: "info@tannrieder.example",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Werkstattweg 4",
        postalCode: "85999",
        addressLocality: "Wendelfing",
        addressRegion: "Bayern",
        addressCountry: "DE",
      },
      openingHoursSpecification: openingHoursSpecification(
        CONTACT.openingHours,
      ),
      areaServed: "Wir arbeiten im Umkreis von etwa 40 km um Wendelfing.",
    });
  });

  it("leaves out what SiteSettings does not have", () => {
    const business = buildLocalBusiness(
      { ...EMPTY, company: { ...EMPTY.company, name: "Schreinerei" } },
      SITE_LINKS,
    );
    expect(business).toEqual({
      "@context": "https://schema.org",
      "@type": "HomeAndConstructionBusiness",
      name: "Schreinerei",
      ...SITE_LINKS,
    });
    expect(JSON.stringify(business)).not.toMatch(/null|undefined|""/);
  });

  it("has only the parts of the address that are there", () => {
    const business = buildLocalBusiness(
      {
        ...EMPTY,
        company: { ...EMPTY.company, name: "Schreinerei", city: "Wendelfing" },
      },
      SITE_LINKS,
    );
    expect(business?.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Wendelfing",
      addressRegion: "Bayern",
      addressCountry: "DE",
    });
  });

  it("is not there at all without a company name", () => {
    expect(buildLocalBusiness(EMPTY, SITE_LINKS)).toBeNull();
  });

  it("links the page's language version of the home page and the site's image", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    expect(localBusiness("en", CONTACT)).toMatchObject({
      url: `${SITE}/en`,
      image: `${SITE}/en/og/site.png`,
    });
    expect(localBusiness("de", CONTACT)).toMatchObject({
      url: `${SITE}/`,
      image: `${SITE}/de/og/site.png`,
    });
  });
});

describe("BreadcrumbList", () => {
  it("numbers the steps from 1 and links each one", () => {
    expect(
      buildBreadcrumbList([
        { name: "Startseite", url: `${SITE}/` },
        { name: "Karriere", url: `${SITE}/karriere` },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Startseite",
          item: `${SITE}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Karriere",
          item: `${SITE}/karriere`,
        },
      ],
    });
  });

  it("goes from the home page over the section to a job, in German", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    const trail = await breadcrumbs("de", "/karriere", {
      name: "Schreiner (m/w/d)",
      href: { pathname: "/karriere/[slug]", params: { slug: "schreiner" } },
    });

    expect(trail.itemListElement.map(({ name, item }) => [name, item])).toEqual(
      [
        ["Startseite", `${SITE}/`],
        ["Karriere", `${SITE}/karriere`],
        ["Schreiner (m/w/d)", `${SITE}/karriere/schreiner`],
      ],
    );
  });

  it("names and links the steps in English on an English page", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    const trail = await breadcrumbs("en", "/datenschutz");

    expect(trail.itemListElement.map(({ name, item }) => [name, item])).toEqual(
      [
        ["Home", `${SITE}/en`],
        ["Privacy policy", `${SITE}/en/privacy`],
      ],
    );
  });
});
