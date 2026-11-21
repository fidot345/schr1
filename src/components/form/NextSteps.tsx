import { useTranslations } from "next-intl";
import { StepNumber } from "@/components/ui/StepNumber";

type NextStepsProps = {
  /** The id of the heading: the <aside> around the column is named by it. */
  headingId: string;
  /** What happens after sending, in order. */
  steps: readonly string[];
  className?: string;
};

/**
 * "Was passiert danach?", the top of the column beside a form, mockup 03:
 * the heading and a numbered list with round 32px numbers.
 */
export function NextSteps({ headingId, steps, className }: NextStepsProps) {
  const t = useTranslations("Form.nextSteps");

  return (
    <div className={className}>
      <h2 id={headingId} className="font-display text-h3">
        {t("title")}
      </h2>
      <ol className="mt-6 flex flex-col gap-5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3.5">
            <StepNumber value={index + 1} size={32} />
            <span className="text-ui">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
