import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Hint and error of a form control. Both are optional. */
export type FieldTexts = {
  hint?: ReactNode;
  error?: ReactNode;
};

/** Ids of the hint and error elements that belong to the control `id`. */
export function fieldIds(id: string) {
  return { hint: `${id}-hint`, error: `${id}-error` };
}

/**
 * aria-describedby and aria-invalid for a control. The error comes first,
 * so a screen reader reads it before the hint.
 */
export function fieldAria(id: string, { hint, error }: FieldTexts) {
  const ids = fieldIds(id);
  const describedBy = [error ? ids.error : null, hint ? ids.hint : null]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : undefined,
  } as const;
}

/**
 * Shared look of text inputs, textareas and selects, BRIEF.md section 3:
 * Weiß background, Feldrand border, 4px radius. An error makes the border
 * a 2px Fehler line; text and icon say the same, so color is not alone.
 */
export function controlClassName(invalid: boolean) {
  return cn(
    "w-full rounded bg-weiss px-4 text-body text-graphit",
    invalid ? "border-2 border-fehler" : "border border-feldrand",
  );
}

export function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      className={cn("size-5 shrink-0", className)}
    >
      {/* The exclamation mark is cut out, so no second color is needed. */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10 1a9 9 0 1 0 0 18a9 9 0 1 0 0-18ZM9 5h2v6.5H9ZM10 13.25a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 1 0 0-2.5Z"
      />
    </svg>
  );
}

export function FieldHint({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <p id={fieldIds(id).hint} className="text-small text-schiefer">
      {children}
    </p>
  );
}

export function FieldError({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const t = useTranslations("Form");

  return (
    <p
      id={fieldIds(id).error}
      className="flex items-start gap-2 text-small font-bold text-fehler"
    >
      <ErrorIcon className="mt-0.5" />
      <span>
        <span className="sr-only">{t("errorPrefix")} </span>
        {children}
      </span>
    </p>
  );
}

export type FieldProps = FieldTexts & {
  /** Id of the control inside; the label points to it. */
  id: string;
  label: ReactNode;
  /** Adds "(optional)" to the label. Required is the default in our forms. */
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label above, then hint, the control and the error below it. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: FieldProps) {
  const t = useTranslations("Form");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
        {optional ? (
          <span className="font-normal text-schiefer"> {t("optional")}</span>
        ) : null}
      </label>
      {hint ? <FieldHint id={id}>{hint}</FieldHint> : null}
      {children}
      {error ? <FieldError id={id}>{error}</FieldError> : null}
    </div>
  );
}
