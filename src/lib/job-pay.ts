import type { Job } from "@/payload-types";

/** What a job pays, as BRIEF.md section 5 has it: a range with its unit. */
export type JobSalary = {
  min: number | null;
  max: number | null;
  unit: NonNullable<Job["payUnit"]>;
};

export type JobPay = {
  /** "1. Jahr 900 €, 2. Jahr 1.000 €…" for an apprenticeship, where a range does not fit. */
  text: string | null;
  /** The figures, when the admin panel has any with their unit. */
  salary: JobSalary | null;
};

/**
 * The pay of a job document. The text and the figures are both kept: the
 * page shows the text when there is one (the owner wrote it because a range
 * does not fit), and the Google markup uses the figures.
 */
export const toJobPay = (
  job: Pick<Job, "payMin" | "payMax" | "payUnit" | "payText">,
): JobPay => {
  const min = job.payMin ?? null;
  const max = job.payMax ?? null;
  const { payUnit } = job;

  return {
    text: job.payText?.trim() || null,
    salary:
      payUnit && (min !== null || max !== null)
        ? { min, max, unit: payUnit }
        : null,
  };
};

/** The shape of the pay line, which the page then writes in its language. */
export type PayShape =
  | { kind: "text"; text: string }
  | { kind: "fixed"; amount: number; unit: JobSalary["unit"] }
  | { kind: "range"; min: number; max: number; unit: JobSalary["unit"] }
  | { kind: "from"; min: number; unit: JobSalary["unit"] }
  | { kind: "upTo"; max: number; unit: JobSalary["unit"] };

/**
 * What to show as the pay of a job, or null when there is nothing to show.
 * The text wins over the figures; equal limits are one amount; one limit
 * alone reads "ab 19 €" or "bis 23 €".
 */
export const payShape = (pay: JobPay): PayShape | null => {
  if (pay.text) {
    return { kind: "text", text: pay.text };
  }
  if (!pay.salary) {
    return null;
  }

  const { min, max, unit } = pay.salary;
  if (min !== null && max !== null) {
    return min === max
      ? { kind: "fixed", amount: min, unit }
      : { kind: "range", min, max, unit };
  }
  if (min !== null) {
    return { kind: "from", min, unit };
  }
  return max === null ? null : { kind: "upTo", max, unit };
};
