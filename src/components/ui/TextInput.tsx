import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlClassName, Field, type FieldProps, fieldAria } from "./Field";

type NativeInputProps = Omit<
  ComponentProps<"input">,
  "id" | "type" | "className" | "children" | "aria-describedby" | "aria-invalid"
>;

export type TextInputProps = NativeInputProps &
  Omit<FieldProps, "children"> & {
    type?: "text" | "email" | "tel" | "url" | "date";
  };

/** One-line text field, 52px high (BRIEF.md section 3, forms). */
export function TextInput({
  id,
  label,
  hint,
  error,
  optional,
  className,
  type = "text",
  ...inputProps
}: TextInputProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        {...inputProps}
        {...fieldAria(id, { hint, error })}
        id={id}
        type={type}
        className={cn(controlClassName(Boolean(error)), "h-13")}
      />
    </Field>
  );
}
