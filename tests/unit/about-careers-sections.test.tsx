import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AboutIntro } from "@/components/about/AboutIntro";
import { TeamList } from "@/components/about/TeamList";
import { ApplyCta } from "@/components/careers/ApplyCta";
import { CareersIntro } from "@/components/careers/CareersIntro";
import { JobDetails } from "@/components/careers/JobDetails";
import { JobIntro } from "@/components/careers/JobIntro";
import { OpenJobs } from "@/components/careers/OpenJobs";
import { TrialDay } from "@/components/careers/TrialDay";
import type { JobListItem, TeamMember } from "@/lib/content";
import type { JobPay } from "@/lib/job-pay";
import { render, tagWithId } from "./support/render";

type MockHref = string | { pathname: string; params?: Record<string, string> };

/* next-intl's Link needs a Next.js request: here it is a plain <a>. */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    className,
    children,
  }: {
    href: MockHref;
    className?: string;
    children: ReactNode;
  }) => (
    <a
      href={
        typeof href === "string"
          ? href
          : href.pathname.replace(
              /\[(\w+)\]/g,
              (_, key: string) => href.params?.[key] ?? "",
            )
      }
      className={className}
    >
      {children}
    </a>
  ),
}));

const count = (html: string, pattern: RegExp): number =>
  html.match(pattern)?.length ?? 0;

const hourly: JobPay = {
  text: null,
  salary: { min: 19, max: 23, unit: "hour" },
};

const apprenticeship: JobPay = {
  text: "1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
  salary: null,
};

const job = (
  id: number,
  slug: string,
  title: string,
  overrides: Partial<JobListItem> = {},
): JobListItem => ({
  id,
  slug,
  title,
  employmentType: "full_time",
  start: "ab sofort",
  hours: "Mo–Do 7:00–16:30, Fr 7:00–12:00",
  pay: hourly,
  ...overrides,
});

const items = (...texts: string[]) =>
  texts.map((text, index) => ({ id: String(index), text }));

const PHONE = "089 99998 412";

describe("CareersIntro", () => {
  it("is the page's h1 and the lead text from Payload", () => {
    const html = render(
      <CareersIntro intro={["Wir suchen Verstärkung.", "Feste Zeiten."]} />,
    );

    expect(tagWithId(html, "karriere-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="karriere-titel"');
    expect(html).toContain(">Karriere</h1>");
    expect(html).toContain("Wir suchen Verstärkung.");
    expect(html).toContain("Feste Zeiten.");
    expect(count(html, /text-lead/g)).toBe(2);
  });

  it("is in English on /en", () => {
    expect(render(<CareersIntro intro={["We are hiring."]} />, "en")).toContain(
      ">Careers</h1>",
    );
  });
});

describe("OpenJobs", () => {
  const jobs = [
    job(1, "schreiner", "Schreiner (m/w/d)"),
    job(3, "ausbildung-schreiner", "Ausbildung zum Schreiner (m/w/d)", {
      employmentType: "apprenticeship",
      start: "September 2027",
      pay: apprenticeship,
    }),
  ];

  it("is an h2 with a link per job to its page", () => {
    const html = render(<OpenJobs jobs={jobs} phone={PHONE} />);

    expect(tagWithId(html, "stellen-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="stellen-titel"');
    expect(html).toContain(">Offene Stellen</h2>");
    expect(html).toMatch(/href="\/karriere\/schreiner"/);
    expect(html).toMatch(/href="\/karriere\/ausbildung-schreiner"/);
    expect(count(html, /<h3[ >]/g)).toBe(2);
    expect(html).toMatch(/<h3 [^>]*>Schreiner \(m\/w\/d\)<\/h3>/);
  });

  it("names type, start and pay under the title", () => {
    const html = render(<OpenJobs jobs={jobs} phone={PHONE} />);

    expect(html).toContain("Vollzeit, ab sofort, 19–23 € pro Stunde");
    expect(html).toContain(
      "Ausbildung, September 2027, 1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
    );
  });

  it("writes the pay in English on /en", () => {
    const html = render(
      <OpenJobs
        jobs={[job(1, "joiner", "Joiner (m/f/d)", { start: "immediately" })]}
        phone={PHONE}
      />,
      "en",
    );

    expect(html).toContain("Full-time, immediately, €19–23 per hour");
  });

  it("leaves out the pay of a job that has none", () => {
    const html = render(
      <OpenJobs
        jobs={[
          job(1, "praktikum", "Praktikum", {
            pay: { text: null, salary: null },
          }),
        ]}
        phone={PHONE}
      />,
    );

    expect(html).toContain("Vollzeit, ab sofort<");
  });

  it("says so and gives the phone when no job is open", () => {
    const html = render(<OpenJobs jobs={[]} phone={PHONE} />);

    expect(html).toContain("Zurzeit ist keine Stelle offen.");
    expect(html).toContain(PHONE);
    expect(html).not.toContain("<ul");
  });
});

describe("TrialDay", () => {
  it("is a Moos band with its heading and a call button", () => {
    const html = render(<TrialDay phone={PHONE} />);

    expect(tagWithId(html, "schnuppertag-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="schnuppertag-titel"');
    expect(html).toContain("bg-moos");
    expect(html).toContain(">Schnuppertag für Schüler:innen</h2>");
    expect(html).toMatch(/href="tel:\+498999998412"[^>]*>[\s\S]*Jetzt anrufen/);
    expect(html).toContain(PHONE);
  });
});

describe("JobIntro", () => {
  const props = {
    title: "Schreiner (m/w/d)",
    intro: ["Du hast deine Ausbildung abgeschlossen?"],
    employmentType: "full_time" as const,
    start: "ab sofort",
    hours: "Mo–Do 7:00–16:30, Fr 7:00–12:00",
    pay: hourly,
  };

  it("has the h1, the introduction and the four facts", () => {
    const html = render(<JobIntro {...props} />);

    expect(tagWithId(html, "stelle-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="stelle-titel"');
    expect(html).toContain("Du hast deine Ausbildung abgeschlossen?");
    for (const [label, value] of [
      ["Art der Stelle", "Vollzeit"],
      ["Start", "ab sofort"],
      ["Arbeitszeit", "Mo–Do 7:00–16:30, Fr 7:00–12:00"],
      ["Lohn", "19–23 € pro Stunde"],
    ]) {
      expect(html).toMatch(
        new RegExp(`<dt [^>]*>${label}</dt><dd [^>]*>${value}</dd>`),
      );
    }
  });

  it("shows the text of an apprenticeship instead of figures", () => {
    const html = render(
      <JobIntro
        {...props}
        employmentType="apprenticeship"
        pay={apprenticeship}
      />,
    );

    expect(html).toMatch(/<dd [^>]*>Ausbildung<\/dd>/);
    expect(html).toContain(
      "1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
    );
  });

  it("leaves out the pay row when there is nothing to show", () => {
    const html = render(
      <JobIntro {...props} pay={{ text: null, salary: null }} />,
    );

    expect(html).not.toContain("Lohn");
    expect(count(html, /<dt /g)).toBe(3);
  });

  it("is in English on /en", () => {
    const html = render(<JobIntro {...props} />, "en");

    expect(html).toMatch(
      /<dt [^>]*>Type of job<\/dt><dd [^>]*>Full-time<\/dd>/,
    );
    expect(html).toMatch(/<dt [^>]*>Pay<\/dt><dd [^>]*>€19–23 per hour<\/dd>/);
  });
});

describe("JobDetails", () => {
  it("is a Moos band with the three lists under h3 headings", () => {
    const html = render(
      <JobDetails
        tasks={items("Küchen fertigen")}
        requirements={items("Führerschein Klasse B")}
        benefits={items("Eigenes Fahrzeug", "Freitags um 12 Uhr Schluss")}
      />,
    );

    expect(tagWithId(html, "details-titel")).toMatch(/^<h2 /);
    expect(html).toContain("bg-moos");
    expect(html).toContain(">Deine Aufgaben</h3>");
    expect(html).toContain(">Was du mitbringst</h3>");
    expect(html).toContain(">Was wir bieten</h3>");
    expect(count(html, /<li /g)).toBe(4);
  });

  it("leaves out an empty list, and the band when all are empty", () => {
    const html = render(
      <JobDetails
        tasks={items("Küchen fertigen")}
        requirements={[]}
        benefits={[]}
      />,
    );

    expect(html).toContain("Deine Aufgaben");
    expect(html).not.toContain("Was du mitbringst");
    expect(
      render(<JobDetails tasks={[]} requirements={[]} benefits={[]} />),
    ).toBe("");
  });
});

describe("ApplyCta", () => {
  it("has a heading, the phone, a call button and the link to all jobs", () => {
    const html = render(<ApplyCta phone={PHONE} />);

    expect(tagWithId(html, "bewerben-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="bewerben-titel"');
    expect(html).toContain(">Bewirb dich</h2>");
    expect(html).toContain(PHONE);
    expect(html).toMatch(/href="tel:\+498999998412"/);
    expect(html).toMatch(
      /href="\/karriere"[^>]*>Alle offenen Stellen ansehen</,
    );
    // The application form is not there yet.
    expect(html).not.toContain("<form");
  });
});

describe("AboutIntro", () => {
  it("is the h1 from Payload, the story and the mark Meisterbetrieb", () => {
    const html = render(
      <AboutIntro
        title="Familienbetrieb seit 1989"
        story={[
          "Georg Tannrieder hat die Werkstatt 1989 gegründet.",
          "Wir arbeiten im Umkreis von 40 km.",
        ]}
      />,
    );

    expect(tagWithId(html, "ueber-uns-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="ueber-uns-titel"');
    expect(html).toContain(">Familienbetrieb seit 1989</h1>");
    expect(html).toContain(
      "Georg Tannrieder hat die Werkstatt 1989 gegründet.",
    );
    expect(html).toContain("Wir arbeiten im Umkreis von 40 km.");
    expect(html).toMatch(/<p [^>]*>Meisterbetrieb<\/p>/);
    expect(count(html, /<img/g)).toBe(0);
  });

  it("is in English on /en", () => {
    const html = render(
      <AboutIntro
        title="Family business since 1989"
        story={["Founded in 1989."]}
      />,
      "en",
    );

    expect(html).toContain("Master craftsman&#x27;s workshop");
  });
});

describe("TeamList", () => {
  const team: TeamMember[] = [
    {
      id: 1,
      name: "Johannes Tannrieder",
      role: "Schreinermeister, Inhaber",
      since: 2003,
    },
    {
      id: 2,
      name: "Georg Tannrieder",
      role: "Gründer, im Ruhestand",
      since: 1989,
    },
  ];

  it("lists name, role and the year, without photos", () => {
    const html = render(<TeamList team={team} />);

    expect(tagWithId(html, "team-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="team-titel"');
    expect(html).toContain(">Das Team</h2>");
    expect(html).toMatch(
      /<dt [^>]*>Johannes Tannrieder<\/dt><dd>Schreinermeister, Inhaber<\/dd><dd [^>]*>seit 2003<\/dd>/,
    );
    expect(html).toContain("seit 1989");
    expect(count(html, /<dt /g)).toBe(2);
    expect(count(html, /<img/g)).toBe(0);
  });

  it("writes the year in English on /en and without a thousands separator", () => {
    const html = render(<TeamList team={team} />, "en");

    expect(html).toContain(">The team</h2>");
    expect(html).toContain("since 2003");
    expect(html).not.toContain("2.003");
  });

  it("is not there without people", () => {
    expect(render(<TeamList team={[]} />)).toBe("");
  });
});
