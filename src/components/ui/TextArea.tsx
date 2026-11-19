import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlClassName, Field, type FieldProps, fieldAria } from "./Field";

type NativeTextAreaProps = Omit<
  ComponentProps<"textarea">,
  "id" | "className" | "children" | "aria-describedby" | "aria-invalid"
>;

export type TextAreaProps = NativeTextAreaProps & Omit<FieldProps, "children">;

/** Multi-line text field. At least 128px high, people can make it taller. */
export function TextArea({
  id,
  label,
  hint,
  error,
  optional,
  className,
  rows = 5,
  ...textAreaProps
}: TextAreaProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <textarea
        {...textAreaProps}
        {...fieldAria(id, { hint, error })}
        id={id}
        rows={rows}
        className={cn(
          controlClassName(Boolean(error)),
          "min-h-32 resize-y py-2",
        )}
      />
    </Field>
  );
}
