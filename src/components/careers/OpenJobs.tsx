import { useTranslations } from "next-intl";
import { AppLink } from "@/components/ui/AppLink";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { JobListItem } from "@/lib/content";
import { useJobPay } from "./useJobPay";

type OpenJobsProps = {
  jobs: JobListItem[];
  /** As people write it, for the line under an empty list. */
  phone: string;
};

function JobRow({ job }: { job: JobListItem }) {
  const tType = useTranslations("EmploymentType");
  const payLabel = useJobPay();
  // "Vollzeit, ab sofort, 19–23 € pro Stunde", as on the home page.
  const meta = [tType(job.employmentType), job.start, payLabel(job.pay)]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="border-t border-linie">
      <AppLink
        href={{ pathname: "/karriere/[slug]", params: { slug: job.slug } }}
        className="group flex items-center gap-4 py-5 text-graphit no-underline"
      >
        <div className="min-w-0 flex-auto">
          <h3 className="font-display text-h4 group-hover:text-tannengruen-dunkel group-hover:underline">
            {job.title}
          </h3>
          <p className="mt-0.5 text-small text-schiefer">{meta}</p>
        </div>
        <ArrowRightIcon size={22} className="shrink-0 text-tannengruen" />
      </AppLink>
    </li>
  );
}

/**
 * The open positions of /karriere, BRIEF.md section 2: rows between lines,
 * each a link to the job with its type, start and pay, like the list on
 * the home page (01g). Without open jobs, a line says so and gives the phone.
 */
export function OpenJobs({ jobs, phone }: OpenJobsProps) {
  const t = useTranslations("CareersPage");

  return (
    <Section labelledBy="stellen-titel">
      <Container>
        <SectionHeading id="stellen-titel" title={t("openTitle")} />
        {jobs.length > 0 ? (
          <ul className="mt-8 border-b border-linie">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        ) : (
          <p className="mt-6 max-w-[34em]">{t("noJobs", { phone })}</p>
        )}
      </Container>
    </Section>
  );
}
