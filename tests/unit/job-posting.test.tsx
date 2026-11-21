import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/ui/JsonLd";
import type { JobDetail } from "@/lib/content";
import { buildJobPosting, jobDescription } from "@/lib/job-posting";
import { render } from "./support/render";

const company = {
  name: "Schreinerei Tannrieder",
  street: "Werkstattweg 4",
  postalCode: "85999",
  city: "Wendelfing",
};

const headings = {
  tasks: "Deine Aufgaben",
  requirements: "Was du mitbringst",
  benefits: "Was wir bieten",
};

const items = (...texts: string[]) =>
  texts.map((text, index) => ({ id: String(index), text }));

const job = (overrides: Partial<JobDetail> = {}): JobDetail => ({
  id: 1,
  title: "Schreiner (m/w/d)",
  employmentType: "full_time",
  start: "ab sofort",
  hours: "Mo–Do 7:00–16:30, Fr 7:00–12:00",
  pay: { text: null, salary: { min: 19, max: 23, unit: "hour" } },
  intro: ["Du hast deine Ausbildung abgeschlossen?"],
  tasks: items("Küchen fertigen"),
  requirements: items("Führerschein Klasse B"),
  benefits: items("Eigenes Fahrzeug"),
  datePosted: "2026-11-02T12:00:00.000Z",
  validThrough: null,
  slugs: { de: "schreiner", en: "joiner" },
  meta: { title: null, description: null },
  ...overrides,
});

describe("jobDescription", () => {
  it("is HTML: the introduction, then the three lists under their headings", () => {
    expect(jobDescription(job(), headings)).toBe(
      "<p>Du hast deine Ausbildung abgeschlossen?</p>" +
        "<p><strong>Deine Aufgaben</strong></p><ul><li>Küchen fertigen</li></ul>" +
        "<p><strong>Was du mitbringst</strong></p><ul><li>Führerschein Klasse B</li></ul>" +
        "<p><strong>Was wir bieten</strong></p><ul><li>Eigenes Fahrzeug</li></ul>",
    );
  });

  it("escapes the text of the admin panel", () => {
    const html = jobDescription(
      job({ intro: ["Hobeln & <b>schleifen</b>"], tasks: items("A < B") }),
      headings,
    );

    expect(html).toContain("<p>Hobeln &amp; &lt;b&gt;schleifen&lt;/b&gt;</p>");
    expect(html).toContain("<li>A &lt; B</li>");
    expect(html).not.toContain("<b>");
  });

  it("leaves out a list without items", () => {
    const html = jobDescription(job({ benefits: [] }), headings);
    expect(html).not.toContain("Was wir bieten");
    expect(html).toContain("Deine Aufgaben");
  });
});

describe("buildJobPosting", () => {
  it("has what Google asks of a JobPosting", () => {
    const posting = buildJobPosting(
      job({ validThrough: "2027-03-31T12:00:00.000Z" }),
      company,
      headings,
    );

    expect(posting).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Schreiner (m/w/d)",
      datePosted: "2026-11-02T12:00:00.000Z",
      validThrough: "2027-03-31T12:00:00.000Z",
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: "Schreinerei Tannrieder",
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Werkstattweg 4",
          postalCode: "85999",
          addressLocality: "Wendelfing",
          addressCountry: "DE",
        },
      },
    });
    expect(posting.description).toContain("<li>Küchen fertigen</li>");
  });

  it("states the pay as a range with its unit", () => {
    const { baseSalary } = buildJobPosting(job(), company, headings);

    expect(baseSalary).toEqual({
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        minValue: 19,
        maxValue: 23,
        unitText: "HOUR",
      },
    });
  });

  it("states equal limits as one value and one limit alone as it is", () => {
    const value = (min: number | null, max: number | null) =>
      buildJobPosting(
        job({ pay: { text: null, salary: { min, max, unit: "month" } } }),
        company,
        headings,
      ).baseSalary?.value;

    expect(value(2500, 2500)).toEqual({
      "@type": "QuantitativeValue",
      value: 2500,
      unitText: "MONTH",
    });
    expect(value(2500, null)).toEqual({
      "@type": "QuantitativeValue",
      minValue: 2500,
      unitText: "MONTH",
    });
    expect(value(null, 3000)).toEqual({
      "@type": "QuantitativeValue",
      maxValue: 3000,
      unitText: "MONTH",
    });
  });

  it("has no pay for a job with only a text, and no end without a date", () => {
    const posting = buildJobPosting(
      job({ pay: { text: "1. Jahr 900 €", salary: null } }),
      company,
      headings,
    );

    expect(posting).not.toHaveProperty("baseSalary");
    expect(posting).not.toHaveProperty("validThrough");
  });

  it("maps the types of employment", () => {
    const type = (employmentType: JobDetail["employmentType"]) =>
      buildJobPosting(job({ employmentType }), company, headings)
        .employmentType;

    expect(type("full_time")).toBe("FULL_TIME");
    expect(type("part_time")).toBe("PART_TIME");
    // Google has no value for an apprenticeship.
    expect(type("apprenticeship")).toBe("OTHER");
  });
});

describe("JsonLd", () => {
  it("is a ld+json script with the data", () => {
    const html = render(
      <JsonLd data={{ "@type": "JobPosting", title: "A" }} />,
    );

    expect(html).toBe(
      '<script type="application/ld+json">{"@type":"JobPosting","title":"A"}</script>',
    );
  });

  it("cannot be closed by a text with a tag", () => {
    const html = render(<JsonLd data={{ title: "</script><b>" }} />);

    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\\u003c/script>\\u003cb>");
  });
});
