import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Link } from "@/i18n/navigation";
import type { JobListItem, TextBlock } from "@/lib/content";
import { Section } from "../Section";

type HomeCareersProps = {
  block: TextBlock;
  jobs: JobListItem[];
};

/**
 * "Wir suchen Verstärkung", BRIEF.md section 2: text from the admin panel,
 * the open positions as a list and "Offene Stellen ansehen".
 */
export function HomeCareers({ block, jobs }: HomeCareersProps) {
  const t = useTranslations("HomePage");
  const tType = useTranslations("EmploymentType");

  return (
    <Section id="home-careers" title={block.title}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-measure text-lead">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7">
          <Heading level={3} size={4} id="home-careers-jobs">
            {t("openJobsTitle")}
          </Heading>
          {jobs.length > 0 ? (
            <ul
              aria-labelledby="home-careers-jobs"
              className="border-t border-linie"
            >
              {jobs.map((job) => (
                <li key={job.id} className="border-b border-linie">
                  <Link
                    href={{
                      pathname: "/karriere/[slug]",
                      params: { slug: job.slug },
                    }}
                    className="group flex min-h-12 flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="font-bold text-tannengruen underline underline-offset-4 group-hover:text-tannengruen-dunkel group-hover:decoration-2">
                      {job.title}
                    </span>
                    <span className="text-schiefer">
                      {tType(job.employmentType)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("noOpenJobs")}</p>
          )}
          <div>
            <Button href="/karriere">{t("openJobsCta")}</Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
