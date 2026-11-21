import { useTranslations } from "next-intl";
import type { AppHref } from "@/components/ui/AppLink";
import { AppLink } from "@/components/ui/AppLink";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import {
  PhotoPlaceholder,
  type PlaceholderPhoto,
} from "@/components/ui/PhotoPlaceholder";
import { Section } from "@/components/ui/Section";

export type JobItem = {
  id: string;
  title: string;
  /** "Vollzeit, ab sofort, 19–23 € pro Stunde" */
  meta: string;
  href: AppHref;
};

export type JobsContent = {
  /** The sentence under the heading. */
  intro: string;
  photo: PlaceholderPhoto;
  jobs: JobItem[];
};

/**
 * "Wir suchen Verstärkung", mockup 01g: the photo on the left and on the
 * right the heading, the open positions between lines, each a link with an
 * arrow, and two buttons. Below 856px of width the photo goes on top.
 */
export function Jobs({ intro, photo, jobs }: JobsContent) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="jobs-titel">
      <Container className="flex flex-wrap items-center gap-14">
        <PhotoPlaceholder
          photo={photo}
          className="h-80 min-w-0 flex-[5_1_340px] md:h-130"
        />
        <div className="min-w-0 flex-[7_1_460px]">
          <h2 id="jobs-titel" className="font-display text-h2">
            {t("jobsTitle")}
          </h2>
          <p className="mt-4 max-w-[34em]">{intro}</p>
          <ul className="mt-8 border-b border-linie">
            {jobs.map((job) => (
              <li key={job.id} className="border-t border-linie">
                <AppLink
                  href={job.href}
                  className="group flex items-center gap-4 py-5 text-graphit no-underline"
                >
                  <span className="min-w-0 flex-auto">
                    <span className="block font-display text-h4 group-hover:text-tannengruen-dunkel group-hover:underline">
                      {job.title}
                    </span>
                    <span className="mt-0.5 block text-small text-schiefer">
                      {job.meta}
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
