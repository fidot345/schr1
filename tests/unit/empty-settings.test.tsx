import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { OpenJobs } from "@/components/careers/OpenJobs";
import { TrialDay } from "@/components/careers/TrialDay";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { CallBox } from "@/components/form/CallBox";
import { Contact } from "@/components/home/Contact";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import {
  getContactDetails,
  getLegalTexts,
  getSiteSettings,
  type SiteContent,
} from "@/lib/content";
import { buildJobPosting } from "@/lib/job-posting";
import { render } from "./support/render";

/*
 * A database whose SiteSettings were never saved, like a fresh preview
 * branch on Neon: Payload returns the global without any of its fields,
 * although the admin panel requires them. The build prerendered /impressum
 * with it and broke in the footer's tel: link. Every page must leave out
 * what is missing instead.
 */

const settings = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock("@/lib/payload", () => ({
  readOptions: (locale: string) => ({ locale }),
  payloadClient: async () => ({
    findGlobal: async () => settings.current,
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string };
    children: ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : href.pathname} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
}));

vi.mock("next/navigation", () => ({ useParams: () => ({}) }));

/** What getSiteSettings makes of an empty global. */
const empty = async (): Promise<SiteContent> => {
  settings.current = {};
  return getSiteSettings("de");
};

/** Text a gap in the data would leave on the page. */
const BROKEN = /undefined|null|\{phone\}|tel:|mailto:|Uhr/;

describe("getSiteSettings without saved settings", () => {
  it("has no contact data, no hours and no footer line", async () => {
    const site = await empty();

    expect(site.company).toEqual({
      name: "",
      logoWord: "",
      owner: "",
      street: null,
      postalCode: null,
      city: null,
      phone: null,
      email: null,
    });
    expect(site.openingHours).toEqual([]);
    expect(site.tagline).toBeNull();
    expect(site.vacation).toBeNull();
  });

  it("treats blank fields as empty and drops half-filled hours", async () => {
    settings.current = {
      company: {
        name: " Schreinerei Tannrieder ",
        phone: "   ",
        email: null,
        street: "",
        postalCode: "85999",
        city: null,
      },
      openingHours: [
        { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
        { id: "b", days: "Fr", hours: " " },
        { id: "c", days: null, hours: "8:00" },
      ],
    };
    const { company, openingHours } = await getSiteSettings("en");

    expect(company).toMatchObject({
      name: "Schreinerei Tannrieder",
      logoWord: "Schreinerei Tannrieder",
      phone: null,
      email: null,
      street: null,
      postalCode: "85999",
      city: null,
    });
    expect(openingHours).toEqual([
      { id: "a", days: "Mo–Do", hours: "7:00–16:30" },
    ]);
  });

  it("has no area of work and no summaries of the legal texts", async () => {
    settings.current = {};

    expect((await getContactDetails("de")).serviceArea).toEqual([]);
    const { imprint, privacy } = await getLegalTexts("de");
    expect(imprint.summary).toBeNull();
    expect(privacy.summary).toBeNull();
  });
});

describe("pages without saved settings", () => {
  it("footer: no contact or hours column, the pages and the concept note stay", async () => {
    const site = await empty();
    const html = render(
      <Footer
        company={site.company}
        openingHours={site.openingHours}
        tagline={site.tagline}
      />,
    );

    expect(html).not.toContain(">Kontakt</h2>");
    expect(html).not.toContain(">Öffnungszeiten</h2>");
    expect(html).not.toContain("<address");
    expect(html).not.toMatch(BROKEN);
    expect(html).toContain(">Seiten</h2>");
    expect(html).toContain("fiktives Unternehmen");
  });

  it("footer: only the lines that are there", async () => {
    const site = await empty();
    const html = render(
      <Footer
        company={{ ...site.company, email: "info@tannrieder.example" }}
        openingHours={[]}
        tagline={null}
      />,
    );

    expect(html).toContain(">Kontakt</h2>");
    expect(html).toMatch(
      /<address[^>]*><a href="mailto:info@tannrieder\.example"[^>]*>info@tannrieder\.example<\/a><\/address>/,
    );
    expect(html).not.toContain("tel:");
  });

  it("contact page: the heading, the lead and the request button, nothing empty", async () => {
    const site = await empty();
    const html = render(<ContactDetails {...site} serviceArea={[]} />);

    expect(html).toContain(">Kontakt</h1>");
    expect(html).toContain('href="/anfrage"');
    expect(html).not.toContain("<address");
    expect(html).not.toContain("<dl");
    expect(html).not.toContain(">Öffnungszeiten</h2>");
    expect(html).not.toMatch(BROKEN);
  });

  it("home page: the contact block without phone, e-mail, address or hours", async () => {
    const site = await empty();
    const html = render(
      <Contact
        company={site.company}
        openingHours={site.openingHours}
        serviceArea={[]}
      />,
    );

    expect(html).toContain('href="/anfrage"');
    expect(html).not.toContain("<address");
    expect(html).not.toContain("<dl");
    expect(html).not.toMatch(BROKEN);
  });

  it("mobile bar: only 'Anfrage', no call button", () => {
    const html = render(<MobileActionBar phone={null} />);

    expect(html).toContain('href="/anfrage"');
    expect(html).not.toContain("tel:");
    expect(html.match(/<li/g)).toHaveLength(1);
  });

  it("call box: left out without a phone", () => {
    expect(render(<CallBox phone={null} openingHours={[]} />)).toBe("");
  });

  it("careers: the texts without a number and no call link", () => {
    const html = [
      render(<OpenJobs jobs={[]} phone={null} />),
      render(<TrialDay />),
    ].join("");

    expect(html).toContain(
      "Melde dich gern, wenn du trotzdem bei uns arbeiten möchtest.",
    );
    expect(html).toContain("Schnuppertag anfragen");
    expect(html).not.toContain("tel:");
    expect(html).not.toMatch(BROKEN);
  });

  it("job posting: no empty name and no null in the address", async () => {
    const { company } = await empty();
    const posting = buildJobPosting(
      {
        title: "Schreiner (m/w/d)",
        employmentType: "full_time",
        intro: [],
        tasks: [],
        requirements: [],
        benefits: [],
        pay: { text: null, salary: null },
        datePosted: "2026-11-02T12:00:00.000Z",
        validThrough: null,
      },
      company,
      { tasks: "Aufgaben", requirements: "Profil", benefits: "Angebot" },
    );

    expect(posting.hiringOrganization).toEqual({ "@type": "Organization" });
    expect(posting.jobLocation.address).toEqual({
      "@type": "PostalAddress",
      addressCountry: "DE",
    });
  });
});
