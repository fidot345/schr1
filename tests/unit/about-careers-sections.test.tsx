import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AboutIntro } from "@/components/about/AboutIntro";
import { AboutPrinciples } from "@/components/about/AboutPrinciples";
import { TeamList } from "@/components/about/TeamList";
import { CareersBenefits } from "@/components/careers/CareersBenefits";
import { CareersFaq } from "@/components/careers/CareersFaq";
import { CareersIntro } from "@/components/careers/CareersIntro";
import { JobDetails } from "@/components/careers/JobDetails";
import { JobIntro } from "@/components/careers/JobIntro";
import { OpenJobs } from "@/components/careers/OpenJobs";
import { TrialDay } from "@/components/careers/TrialDay";
import type { JobListItem, TeamMember } from "@/lib/content";
import type { JobPay } from "@/lib/job-pay";
import type { Photo } from "@/lib/media";
import { render, tagWithId } from "./support/render";

type MockHref =
  | string
  | {
      pathname: string;
      params?: Record<string, string>;
      query?: Record<string, string>;
      hash?: string;
    };

/** The href of a plain <a>: the params filled in, then the query and the hash. */
const hrefOf = (href: MockHref): string => {
  if (typeof href === "string") {
    return href;
  }
  const path = href.pathname.replace(
    /\[(\w+)\]/g,
    (_, key: string) => href.params?.[key] ?? "",
  );
  const query = href.query ? `?${new URLSearchParams(href.query)}` : "";
  return `${path}${query}${href.hash ? `#${href.hash}` : ""}`;
};

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
    <a href={hrefOf(href)} className={className}>
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

const photo = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Foto ${name}`,
  width: 2400,
  height: 1600,
  position: "50% 50%",
});

describe("CareersIntro", () => {
  it("is the page's h1 and the lead text from Payload", () => {
    const html = render(
      <CareersIntro
        intro={["Wir suchen Verstärkung.", "Feste Zeiten."]}
        photo={null}
      />,
    );

    expect(tagWithId(html, "karriere-titel")).toMatch(/^<h1 /);
    expect(html).toContain('aria-labelledby="karriere-titel"');
    expect(html).toContain(">Karriere</h1>");
    expect(html).toContain("Wir suchen Verstärkung.");
    expect(html).toContain("Feste Zeiten.");
    expect(count(html, /text-lead/g)).toBe(2);
    expect(count(html, /<img/g)).toBe(0);
  });

  it("shows the photo of the careers block next to the text, loaded first", () => {
    const html = render(
      <CareersIntro intro={["Feste Zeiten."]} photo={photo("karriere")} />,
    );

    expect(html).toContain('alt="Foto karriere"');
    expect(html).toContain('loading="eager"');
    expect(html.indexOf("<img")).toBeGreaterThan(html.indexOf("<h1"));
  });

  it("is in English on /en", () => {
    expect(
      render(<CareersIntro intro={["We are hiring."]} photo={null} />, "en"),
    ).toContain(">Careers</h1>");
  });
});

describe("CareersBenefits", () => {
  const html = render(
    <CareersBenefits
      benefits={items(
        "Feste Arbeitszeiten, freitags ist um 12 Uhr Schluss",
        "Moderne Maschinen in der Werkstatt",
        "Eigenes Fahrzeug für die Montage",
        "Unterstützung, wenn du deinen Meister machen willst",
      )}
    />,
  );

  it("is named by its h2 and lists every point", () => {
    expect(tagWithId(html, "vorteile-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="vorteile-titel"');
    expect(html).toContain(">Was wir bieten</h2>");
    expect(count(html, /<li /g)).toBe(4);
    expect(html).toContain("freitags ist um 12 Uhr Schluss");
  });

  it("is in English on /en and left out without points", () => {
    expect(
      render(<CareersBenefits benefits={items("Fixed hours")} />, "en"),
    ).toContain(">What we offer</h2>");
    expect(render(<CareersBenefits benefits={[]} />)).toBe("");
  });
});

describe("CareersFaq", () => {
  const faq = [
    { id: "1", title: "Brauche ich einen Lebenslauf?", text: "Nein." },
    { id: "2", title: "Wann fange ich an?", text: "Wenn es dir passt." },
  ];
  const html = render(<CareersFaq faq={faq} />);

  it("is named by its h2 and has every question with its answer", () => {
    expect(tagWithId(html, "fragen-titel")).toMatch(/^<h2 /);
    expect(html).toContain(">Häufige Fragen</h2>");
    expect(count(html, /<dt /g)).toBe(2);
    expect(count(html, /<dd /g)).toBe(2);
    expect(html).toMatch(
      /Brauche ich einen Lebenslauf\?<\/dt><dd [^>]*>Nein\.</,
    );
  });

  it("shows the answers open, without a button or details element", () => {
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<details");
  });

  it("is in English on /en and left out without questions", () => {
    expect(render(<CareersFaq faq={faq} />, "en")).toContain(
      ">Frequently asked questions</h2>",
    );
    expect(render(<CareersFaq faq={[]} />)).toBe("");
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
  it("is a Moos band with its heading and a button to the form", () => {
    const html = render(<TrialDay />);

    expect(tagWithId(html, "schnuppertag-titel")).toMatch(/^<h2 /);
    expect(html).toContain('aria-labelledby="schnuppertag-titel"');
    expect(html).toContain("bg-moos");
    expect(html).toContain(">Schnuppertag für Schüler:innen</h2>");
    // The form further down, with "Schnuppertag / Praktikum" chosen.
    expect(html).toMatch(
      /href="\/karriere\?stelle=schnuppertag#bewerben"[^>]*>[\s\S]*Schnuppertag anfragen/,
    );
    expect(html).toContain("Formular weiter unten");
    expect(html).not.toContain("tel:");
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

describe("AboutIntro", () => {
  it("is the h1 from Payload, the story and the mark Meisterbetrieb", () => {
    const html = render(
      <AboutIntro
        title="Familienbetrieb seit 1989"
        story={[
          "Georg Tannrieder hat die Werkstatt 1989 gegründet.",
          "Wir arbeiten im Umkreis von 40 km.",
        ]}
        photo={null}
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
        photo={null}
      />,
      "en",
    );

    expect(html).toContain("Master craftsman&#x27;s workshop");
  });

  it("shows the photo of the workshop next to the story, loaded first", () => {
    const html = render(
      <AboutIntro
        title="Familienbetrieb seit 1989"
        story={["Gegründet 1989."]}
        photo={photo("about-werkstatt")}
      />,
    );

    expect(count(html, /<img/g)).toBe(1);
    expect(html).toContain('alt="Foto about-werkstatt"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain("md:aspect-3/2");
  });
});

describe("AboutPrinciples", () => {
  const principles = [
    { id: "1", title: "Aus einer Werkstatt", text: "Alles entsteht bei uns." },
    { id: "2", title: "Ein Team", text: "Wer baut, montiert auch." },
    { id: "3", title: "Feste Termine", text: "Was wir zusagen, halten wir." },
  ];
  const html = render(<AboutPrinciples principles={principles} />);

  it("is a Moos band named by its h2, a heading and text per principle", () => {
    expect(tagWithId(html, "grundsaetze-titel")).toMatch(/^<h2 /);
    expect(html).toContain(">So arbeiten wir</h2>");
    expect(html).toContain("bg-moos");
    expect(count(html, /<h3 /g)).toBe(3);
    expect(html).toContain("Was wir zusagen, halten wir.");
  });

  it("has no numbers: the principles have no order", () => {
    expect(html).not.toContain("<ol");
    expect(html).not.toMatch(/>[1-3]</);
  });

  it("is in English on /en and left out without principles", () => {
    expect(render(<AboutPrinciples principles={principles} />, "en")).toContain(
      ">How we work</h2>",
    );
    expect(render(<AboutPrinciples principles={[]} />)).toBe("");
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
