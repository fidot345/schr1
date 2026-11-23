import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { JobDetail } from "@/lib/content";
import { useJobPay } from "./useJobPay";

type JobIntroProps = Pick<
  JobDetail,
  "title" | "intro" | "employmentType" | "start" | "hours" | "pay"
>;

/**
 * The top of a job page, BRIEF.md section 2: the title, the introduction and
 * the facts (type, start, working hours, pay), laid out like the top of a
 * project page: the facts are rows with Linie between them. The pay is
 * left out when the job has none to show.
 */
export function JobIntro({
  title,
  intro,
  employmentType,
  start,
  hours,
  pay,
}: JobIntroProps) {
  const t = useTranslations("JobPage");
  const tType = useTranslations("EmploymentType");
  const payLabel = useJobPay();
  const rows = [
    {
      key: "employmentType",
      label: t("employmentType"),
      value: tType(employmentType),
    },
    { key: "start", label: t("start"), value: start },
    { key: "hours", label: t("hours"), value: hours },
    { key: "pay", label: t("pay"), value: payLabel(pay) },
  ];

  return (
    <Section
      labelledBy="stelle-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container>
        <h1 id="stelle-titel" className="font-display text-h1">
          {title}
        </h1>
        {intro.map((paragraph, index) => (
          <p
            key={paragraph}
            className={
              index === 0
                ? "mt-6 max-w-[34em] text-lead"
                : "mt-4 max-w-[34em] text-lead"
            }
          >
            {paragraph}
          </p>
        ))}
        <dl className="mt-8 max-w-135 divide-y divide-linie text-ui">
          {rows.map((row) =>
            row.value ? (
              <div key={row.key} className="flex gap-4 py-3 first:pt-0">
                <dt className="w-32 shrink-0 text-schiefer">{row.label}</dt>
                <dd className="min-w-0">{row.value}</dd>
              </div>
            ) : null,
          )}
        </dl>
      </Container>
    </Section>
  );
}
