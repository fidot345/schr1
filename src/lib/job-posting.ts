import type { CompanyData, JobDetail } from "./content";
import type { JobSalary } from "./job-pay";

/*
 * The JobPosting markup for Google, BRIEF.md section 5: title, description,
 * date posted, valid through, type of employment, employer, place and pay.
 * Built from the job page's own data and checked in the Rich Results Test.
 */

/** The headings of the three lists in the description, in the page's language. */
export type JobPostingHeadings = {
  tasks: string;
  requirements: string;
  benefits: string;
};

type JobPostingSource = Pick<
  JobDetail,
  | "title"
  | "employmentType"
  | "intro"
  | "tasks"
  | "requirements"
  | "benefits"
  | "datePosted"
  | "validThrough"
  | "pay"
>;

/** Values Google knows. It has none for an apprenticeship, so that one is OTHER. */
const EMPLOYMENT_TYPE: Record<JobDetail["employmentType"], string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  apprenticeship: "OTHER",
};

const UNIT_TEXT: Record<JobSalary["unit"], string> = {
  hour: "HOUR",
  month: "MONTH",
};

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const list = (heading: string, items: readonly { text: string }[]): string =>
  items.length === 0
    ? ""
    : `<p><strong>${escapeHtml(heading)}</strong></p><ul>${items
        .map((item) => `<li>${escapeHtml(item.text)}</li>`)
        .join("")}</ul>`;

/** The description is HTML, as Google wants it: the introduction and the three lists. */
export const jobDescription = (
  job: Pick<JobPostingSource, "intro" | "tasks" | "requirements" | "benefits">,
  headings: JobPostingHeadings,
): string =>
  [
    ...job.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    list(headings.tasks, job.tasks),
    list(headings.requirements, job.requirements),
    list(headings.benefits, job.benefits),
  ].join("");

/** MonetaryAmount for the figures; one amount when both limits are equal. */
const baseSalary = ({ min, max, unit }: JobSalary) => ({
  "@type": "MonetaryAmount",
  currency: "EUR",
  value: {
    "@type": "QuantitativeValue",
    ...(min !== null && min === max ? { value: min } : {}),
    ...(min !== null && min !== max ? { minValue: min } : {}),
    ...(max !== null && min !== max ? { maxValue: max } : {}),
    unitText: UNIT_TEXT[unit],
  },
});

export function buildJobPosting(
  job: JobPostingSource,
  company: Pick<CompanyData, "name" | "street" | "postalCode" | "city">,
  headings: JobPostingHeadings,
) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescription(job, headings),
    datePosted: job.datePosted,
    ...(job.validThrough ? { validThrough: job.validThrough } : {}),
    employmentType: EMPLOYMENT_TYPE[job.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: company.street,
        postalCode: company.postalCode,
        addressLocality: company.city,
        addressCountry: "DE",
      },
    },
    ...(job.pay.salary ? { baseSalary: baseSalary(job.pay.salary) } : {}),
  };
}
