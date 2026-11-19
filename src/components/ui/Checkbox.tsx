import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldError, FieldHint, type FieldTexts, fieldAria } from "./Field";

type NativeCheckboxProps = Omit<
  ComponentProps<"input">,
  "id" | "type" | "className" | "children" | "aria-describedby" | "aria-invalid"
>;

export type CheckboxProps = NativeCheckboxProps &
  FieldTexts & {
    id: string;
    label: ReactNode;
    className?: string;
  };

/**
 * Checkbox with the label on its right. The whole row is at least 48px high
 * and the label is clickable. The box is drawn by us so an error can turn its
 * border Fehler, like the other fields.
 */
export function Checkbox({
  id,
  label,
  hint,
  error,
  className,
  ...inputProps
}: CheckboxProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex min-h-12 items-start gap-4 py-2">
        <span className="relative mt-0.5 flex size-6 shrink-0">
          <input
            {...inputProps}
            {...fieldAria(id, { hint, error })}
            id={id}
            type="checkbox"
            className={cn(
              "peer size-6 cursor-pointer appearance-none rounded border-2 bg-weiss",
              error ? "border-fehler" : "border-feldrand",
              "checked:border-tannengruen checked:bg-tannengruen",
            )}
          />
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute inset-0 hidden size-6 text-weiss peer-checked:block"
          >
            <path
              d="M6 12.5l4 4 8-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <label htmlFor={id} className="cursor-pointer">
          {label}
        </label>
      </div>
      {hint ? <FieldHint id={id}>{hint}</FieldHint> : null}
      {error ? <FieldError id={id}>{error}</FieldError> : null}
    </div>
  );
}
