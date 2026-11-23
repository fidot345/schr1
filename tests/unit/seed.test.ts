import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  homePage,
  jobs,
  PHOTOS,
  projects,
  services,
  siteSettings,
  team,
  testimonials,
} from "../../seed/data";
import { richText } from "../../seed/lexical";
import { parseManifest } from "../../seed/manifest";
import { SLUG_PATTERN } from "../../src/lib/slugify";

const manifestText = readFileSync("seed/images/MANIFEST.md", "utf8");
const langs = ["de", "en"] as const;

describe("seed manifest", () => {
  const manifest = parseManifest(manifestText);

  it("describes exactly the photos the seed uploads", () => {
    expect(manifest.map((entry) => entry.file).sort()).toEqual(
      [...PHOTOS].sort(),
    );
  });

  it("points to files that exist", () => {
    for (const file of PHOTOS) {
      expect(existsSync(`seed/images/${file}`), file).toBe(true);
    }
  });

  it("has author, https source, license and both alt texts", () => {
    for (const entry of manifest) {
      expect(entry.credit, entry.file).not.toBe("");
      expect(entry.source, entry.file).toMatch(/^https:\/\/\S+$/);
      expect(["unsplash", "pexels"]).toContain(entry.license);
      expect(entry.alt.de.length, entry.file).toBeGreaterThan(20);
      expect(entry.alt.en.length, entry.file).toBeGreaterThan(20);
    }
  });

  it("uses a different source link for every photo, the seed key", () => {
    const sources = manifest.map((entry) => entry.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("refuses a photo without alt text", () => {
    const broken = manifestText.replace(
      /\| hero-1\.jpg \| Ein Handwerker.*\n/,
      "",
    );
    expect(() => parseManifest(broken)).toThrow(/no alt text for hero-1\.jpg/);
  });
});

describe("seed content", () => {
  it("has the amounts from the brief", () => {
    expect(services).toHaveLength(4);
    expect(projects).toHaveLength(6);
    expect(jobs).toHaveLength(3);
    expect(team).toHaveLength(10);
    expect(testimonials).toHaveLength(3);
    for (const lang of langs) {
      expect(homePage.text[lang].processSteps).toHaveLength(4);
      expect(homePage.text[lang].sceneCaptions).toHaveLength(6);
      expect(homePage.text[lang].hero.facts).toHaveLength(3);
      expect(homePage.text[lang].careers.benefits).toHaveLength(4);
    }
    expect(homePage.featuredProjects).toHaveLength(3);
  });

  it("gives the about and careers blocks photos the seed uploads", () => {
    expect(PHOTOS).toContain(homePage.heroImage);
    expect(PHOTOS).toContain(homePage.aboutImage);
    expect(PHOTOS).toContain(homePage.careersImage);
    expect(new Set([homePage.aboutImage, homePage.careersImage]).size).toBe(2);
  });

  it("starts every scene caption with the step's name", () => {
    for (const lang of langs) {
      for (const caption of homePage.text[lang].sceneCaptions) {
        expect(caption).toMatch(/^[^:.]{1,30}[:.] \S/);
      }
    }
  });

  it("has a footer line in both languages within the field limit", () => {
    for (const lang of langs) {
      expect(siteSettings.tagline[lang].length).toBeGreaterThan(0);
      expect(siteSettings.tagline[lang].length).toBeLessThanOrEqual(120);
    }
  });

  it("uses valid slugs, unique per language", () => {
    for (const docs of [services, projects, jobs]) {
      for (const lang of langs) {
        const slugs = docs.map((doc) => doc.text[lang].slug);
        for (const slug of slugs) {
          expect(slug).toMatch(SLUG_PATTERN);
        }
        expect(new Set(slugs).size).toBe(slugs.length);
      }
    }
    expect(services.map((service) => service.text.de.slug)).toContain(
      "kuechen",
    );
    expect(services.map((service) => service.text.en.slug)).toContain(
      "kitchens",
    );
    expect(projects.map((project) => project.text.de.slug)).toContain(
      "wohnkueche-in-eiche",
    );
    expect(jobs.map((job) => job.text.de.slug)).toContain("schreiner");
  });

  it("links only to services and projects that exist", () => {
    const serviceSlugs = services.map((service) => service.text.de.slug);
    const projectSlugs = projects.map((project) => project.text.de.slug);
    for (const project of projects) {
      expect(serviceSlugs).toContain(project.service);
    }
    for (const slug of [
      ...homePage.featuredProjects,
      ...testimonials.map((testimonial) => testimonial.project),
    ]) {
      expect(projectSlugs).toContain(slug);
    }
    expect(new Set(homePage.featuredProjects).size).toBe(3);
  });

  it("uses the same English and German lists, item by item", () => {
    for (const service of services) {
      expect(service.text.en.included).toHaveLength(
        service.text.de.included.length,
      );
      expect(service.text.en.materials).toHaveLength(
        service.text.de.materials.length,
      );
    }
    for (const job of jobs) {
      for (const list of ["tasks", "requirements", "benefits"] as const) {
        expect(job.text.en[list]).toHaveLength(job.text.de[list].length);
      }
    }
  });

  it("keeps the search texts within the field limits", () => {
    for (const lang of langs) {
      expect(homePage.text[lang].meta.title.length).toBeLessThanOrEqual(70);
      expect(homePage.text[lang].meta.description.length).toBeLessThanOrEqual(
        160,
      );
    }
  });

  it("follows the demo rules for contact data", () => {
    expect(siteSettings.company.phone).toBe("089 99998 412");
    expect(siteSettings.company.email).toMatch(/@[a-z0-9.-]+\.example$/);
    expect(siteSettings.company.postalCode).toMatch(/^\d{5}$/);
  });

  it("puts the family name next to the logo mark", () => {
    expect(siteSettings.company.logoWord).toBe("Tannrieder");
    expect(siteSettings.company.name).toContain(siteSettings.company.logoWord);
  });

  it("has no walnut, placeholder text or invented counters", () => {
    const text = JSON.stringify({
      services,
      projects,
      jobs,
      team,
      testimonials,
      homePage,
      siteSettings,
    });
    expect(text).not.toMatch(/Nussbaum|walnut|lorem|ipsum|\d+\s*\+/i);
  });

  it("states the pay the brief gives", () => {
    const [joiner, fitter, apprenticeship] = jobs;
    expect([joiner?.payMin, joiner?.payMax, joiner?.payUnit]).toEqual([
      19,
      23,
      "hour",
    ]);
    expect([fitter?.payMin, fitter?.payMax, fitter?.payUnit]).toEqual([
      18,
      21,
      "hour",
    ]);
    expect(apprenticeship?.employmentType).toBe("apprenticeship");
    expect(apprenticeship?.text.de.payText).toBe(
      "1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
    );
  });
});

describe("richText", () => {
  it("builds a Lexical root with headings and paragraphs", () => {
    const state = richText([{ h2: "Titel" }, { p: "Absatz" }]);
    expect(state.root.type).toBe("root");
    expect(state.root.children.map((child) => child.type)).toEqual([
      "heading",
      "paragraph",
    ]);
    expect(state.root.children[0]).toMatchObject({
      tag: "h2",
      children: [{ type: "text", text: "Titel" }],
    });
  });
});
