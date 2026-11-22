import { useTranslations } from "next-intl";
import { useJobMeta } from "@/components/careers/useJobMeta";
import { AppLink } from "@/components/ui/AppLink";
import { ButtonLink } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/Section";
import type { CareersBlock, JobListItem } from "@/lib/content";

type JobsProps = Pick<CareersBlock, "title" | "paragraphs" | "photo"> & {
  /** The open positions, in the admin panel's order. */
  jobs: JobListItem[];
};

/**
 * "Wir suchen Verstärkung", mockup 01g: the photo on the left and on the
 * right the heading and text of the "Karriere" block, the open positions
 * between lines, each a link with an arrow, and two buttons. Below 856px of
 * width the photo goes on top. Without open positions only the buttons
 * stay: /karriere says how to apply anyway.
 */
export function Jobs({ title, paragraphs, photo, jobs }: JobsProps) {
  const t = useTranslations("HomePage");
  const jobMeta = useJobMeta();

  return (
    <Section labelledBy="jobs-titel">
      <Container className="flex flex-wrap items-center gap-14">
        <CmsImage
          photo={photo}
          frameClassName="h-80 min-w-0 flex-[5_1_340px] md:h-130"
          sizes="(min-width: 80rem) 500px, (min-width: 56rem) 42vw, 100vw"
        />
        <div className="min-w-0 flex-[7_1_460px]">
          <h2 id="jobs-titel" className="font-display text-h2">
            {title}
          </h2>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-[34em]">
              {paragraph}
            </p>
          ))}
          {jobs.length > 0 ? (
            <ul className="mt-8 border-b border-linie">
              {jobs.map((job) => (
                <li key={job.id} className="border-t border-linie">
                  <AppLink
                    href={{
                      pathname: "/karriere/[slug]",
                      params: { slug: job.slug },
                    }}
                    className="group flex items-center gap-4 py-5 text-graphit no-underline"
                  >
                    <span className="min-w-0 flex-auto">
                      <span className="block font-display text-h4 group-hover:text-tannengruen-dunkel group-hover:underline">
                        {job.title}
                      </span>
                      <span className="mt-0.5 block text-small text-schiefer">
                        {jobMeta(job)}
                      </span>
                    </span>
                    <ArrowRightIcon
                      size={22}
                      className="shrink-0 text-tannengruen"
                    />
                  </AppLink>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:gap-4">
            <ButtonLink href="/karriere" className="w-full md:w-auto">
              {t("openJobsCta")}
            </ButtonLink>
            <ButtonLink
              href="/karriere"
              variant="secondary"
              className="w-full md:w-auto"
            >
              {t("trialDayCta")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
