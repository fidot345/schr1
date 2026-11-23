import { useTranslations } from "next-intl";
import { CallBox } from "@/components/form/CallBox";
import { ConceptNote } from "@/components/form/ConceptNote";
import { NextSteps } from "@/components/form/NextSteps";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import type { SiteContent } from "@/lib/content";
import { telHref } from "@/lib/phone";
import { ApplicationForm, type ApplicationJob } from "./ApplicationForm";
import { APPLY_SECTION_ID } from "./trial-day-href";

type ApplySectionProps = {
  jobs: readonly ApplicationJob[];
  /** On a job page, that job's id: it is chosen at first. */
  defaultJob?: string;
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string | null;
  openingHours: SiteContent["openingHours"];
  /** A job page links back to the list of all open jobs. */
  allJobsLink?: boolean;
};

/**
 * "In 60 Sekunden bewerben – ohne Lebenslauf", BRIEF.md sections 2 and 5:
 * a white band with a line on top, the form on the left with the concept
 * note under it, and beside it (below it on the phone) what happens next
 * and the phone number, as on /anfrage. Without JavaScript the form does
 * not work, so a note gives the phone number.
 */
export function ApplySection({
  jobs,
  defaultJob,
  phone,
  openingHours,
  allJobsLink = false,
}: ApplySectionProps) {
  const t = useTranslations("ApplicationForm");
  const tJob = useTranslations("JobPage");
  const tel = telHref(phone);

  return (
    <Section variant="line" id={APPLY_SECTION_ID} labelledBy="bewerben-titel">
      <Container>
        <h2 id="bewerben-titel" className="font-display text-h2">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-[34em] text-lead">{t("lead")}</p>
        <noscript>
          <p className="mt-6 max-w-[34em] rounded bg-moos px-6 py-5 font-bold">
            {tel && phone
              ? t.rich("noscript", {
                  phone,
                  link: (chunks) => <TextLink href={tel}>{chunks}</TextLink>,
                })
              : t.rich("noscriptNoPhone", {
                  link: (chunks) => (
                    <TextLink href="/kontakt">{chunks}</TextLink>
                  ),
                })}
          </p>
        </noscript>

        <div className="mt-10 flex flex-wrap items-start gap-14">
          <div className="min-w-0 flex-[7_1_560px]">
            <ApplicationForm
              jobs={jobs}
              defaultJob={defaultJob}
              phone={phone}
            />
            <ConceptNote className="mt-4" />
          </div>
          <aside
            aria-labelledby="bewerben-danach"
            className="min-w-0 flex-[4_1_300px]"
          >
            <NextSteps
              headingId="bewerben-danach"
              steps={[
                t("nextSteps.first"),
                t("nextSteps.second"),
                t("nextSteps.third"),
              ]}
            />
            <CallBox
              className="mt-9"
              phone={phone}
              openingHours={openingHours}
            />
            {allJobsLink ? (
              <TextLink href="/karriere" className="mt-8 inline-block">
                {tJob("allJobs")}
              </TextLink>
            ) : null}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
