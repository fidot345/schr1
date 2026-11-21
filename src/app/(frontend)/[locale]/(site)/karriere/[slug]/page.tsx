import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApplyCta } from "@/components/careers/ApplyCta";
import { JobDetails } from "@/components/careers/JobDetails";
import { JobIntro } from "@/components/careers/JobIntro";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { getJob, getOpenJobs, getSiteSettings } from "@/lib/content";
import { buildJobPosting } from "@/lib/job-posting";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Every open job in both languages, with the slug of that language:
 * /karriere/schreiner and /en/careers/joiner. A job switched on later is
 * built on its first visit; a job that is switched off or unknown gives 404.
 */
export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) {
    return [];
  }
  const jobs = await getOpenJobs(locale);
  return jobs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const job = await getJob(locale, slug);
  if (!job) {
    // The 404 title of not-found.tsx, also once the browser has the page.
    notFound();
  }

  return {
    // An SEO title from the admin panel names the company itself, as on the
    // home page; otherwise the job title goes through the template.
    title: job.meta.title ? { absolute: job.meta.title } : job.title,
    // Without one from the admin panel, the first paragraph of the introduction.
    description: job.meta.description ?? job.intro[0],
    alternates: pageAlternates(locale, (code) => ({
      pathname: "/karriere/[slug]",
      params: { slug: job.slugs[code] },
    })),
  };
}

/**
 * A job, BRIEF.md section 2: the title with the facts, what the job
 * involves, and the way to apply, with the JobPosting markup for Google.
 * Until the application form (stage 4) the way to apply is a call.
 */
export default async function JobPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const job = await getJob(locale, slug);
  if (!job) {
    notFound();
  }
  const [{ company }, t] = await Promise.all([
    getSiteSettings(locale),
    getTranslations({ locale, namespace: "JobPage" }),
  ]);

  return (
    <>
      <JsonLd
        data={buildJobPosting(job, company, {
          tasks: t("tasksTitle"),
          requirements: t("requirementsTitle"),
          benefits: t("benefitsTitle"),
        })}
      />
      <JobIntro
        title={job.title}
        intro={job.intro}
        employmentType={job.employmentType}
        start={job.start}
        hours={job.hours}
        pay={job.pay}
      />
      <JobDetails
        tasks={job.tasks}
        requirements={job.requirements}
        benefits={job.benefits}
      />
      <ApplyCta phone={company.phone} />
    </>
  );
}
