import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type FormError = {
  /** The id of the field the error belongs to: the link jumps there. */
  fieldId: string;
  message: string;
};

type ErrorSummaryProps = {
  errors: readonly FormError[];
  className?: string;
};

/**
 * The list of errors at the top of a form, mockup 03: a 2px Fehler frame on
 * Weiß, the title in bold and one link per error to its field. role="alert"
 * makes a screen reader read it as soon as it appears. Nothing is rendered
 * without errors.
 */
export function ErrorSummary({ errors, className }: ErrorSummaryProps) {
  const t = useTranslations("Form.errorSummary");

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "rounded border-2 border-fehler bg-weiss px-6 py-5",
        className,
      )}
    >
      <h2 className="font-sans text-body font-bold">{t("titleFormal")}</h2>
      <ul className="mt-2 list-disc pl-5 text-ui">
        {errors.map(({ fieldId, message }) => (
          <li key={fieldId}>
            <a href={`#${fieldId}`} className="text-fehler">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
