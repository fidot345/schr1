import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ErrorIcon } from "./Field";
import { Heading } from "./Heading";

export type ErrorSummaryItem = {
  /** Id of the field with the error; the link jumps to it. */
  fieldId: string;
  message: string;
};

type ErrorSummaryProps = {
  errors: ErrorSummaryItem[];
  /** Sie on most pages, du on the career pages (BRIEF.md section 2). */
  address?: "formal" | "informal";
  /** The form can focus the summary by this id; tabIndex -1 allows it. */
  id?: string;
  className?: string;
};

/**
 * List of form errors above the form. It is a live region (role="alert"),
 * so a screen reader reads it as soon as it appears. Renders nothing
 * without errors.
 */
export function ErrorSummary({
  errors,
  address = "formal",
  id = "error-summary",
  className,
}: ErrorSummaryProps) {
  const t = useTranslations("Form.errorSummary");

  if (errors.length === 0) {
    return null;
  }

  const titleId = `${id}-title`;

  return (
    <div
      id={id}
      role="alert"
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn("rounded border-2 border-fehler bg-weiss p-6", className)}
    >
      <Heading
        level={2}
        size={4}
        id={titleId}
        className="flex items-center gap-2 text-fehler"
      >
        <ErrorIcon />
        {address === "formal" ? t("titleFormal") : t("titleInformal")}
      </Heading>
      <ul className="mt-4 flex flex-col gap-2">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="font-bold text-fehler underline underline-offset-4 hover:decoration-2"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
