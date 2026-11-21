import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type StepperProps = {
  /** The titles of the steps, in order. */
  steps: readonly string[];
  /** The number of the current step, counting from 1. */
  current: number;
  className?: string;
};

/**
 * The steps of a form above its card, mockup 03: a 4px bar per step with
 * "Schritt 1 von 3" and the title below it. The current step is Tannengrün
 * and bold, the others Linie and Schiefer. The list is named and the current
 * item carries aria-current="step", so the progress is not only a color.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  const t = useTranslations("Form.stepper");

  return (
    <ol
      aria-label={t("label")}
      className={cn("flex flex-wrap gap-3", className)}
    >
      {steps.map((title, index) => {
        const number = index + 1;
        const active = number === current;

        return (
          <li
            key={title}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex-[1_1_160px] border-t-4 pt-3",
              active ? "border-tannengruen" : "border-linie text-schiefer",
            )}
          >
            <span
              className={cn(
                "block text-xs",
                active && "font-bold text-tannengruen",
              )}
            >
              {t("step", { current: number, total: steps.length })}
            </span>
            <span className={cn("block text-ui", active && "font-bold")}>
              {title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
