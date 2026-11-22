import { useTranslations } from "next-intl";
import type { JobListItem } from "@/lib/content";
import { useJobPay } from "./useJobPay";

/**
 * The line of facts under a job title, in the page's language:
 * "Vollzeit, ab sofort, 19–23 € pro Stunde". The same on the home page and
 * on /karriere. A job without pay leaves that part out.
 */
export function useJobMeta(): (job: JobListItem) => string {
  const tType = useTranslations("EmploymentType");
  const payLabel = useJobPay();

  return (job) =>
    [tType(job.employmentType), job.start, payLabel(job.pay)]
      .filter(Boolean)
      .join(", ");
}
