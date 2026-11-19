import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlClassName, Field, type FieldProps, fieldAria } from "./Field";

export type SelectOption = {
  value: string;
  label: string;
};

type NativeSelectProps = Omit<
  ComponentProps<"select">,
  | "id"
  | "className"
  | "children"
  | "multiple"
  | "aria-describedby"
  | "aria-invalid"
>;

export type SelectProps = NativeSelectProps &
  Omit<FieldProps, "children"> & {
    options: SelectOption[];
    /** Text of an empty first option, for example "Bitte wählen". */
    placeholder?: string;
  };

/** Native select with our own chevron; 52px high like the text field. */
export function Select({
  id,
  label,
  hint,
  error,
  optional,
  className,
  options,
  placeholder,
  ...selectProps
}: SelectProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <div className="relative">
        <select
          {...selectProps}
          {...fieldAria(id, { hint, error })}
          id={id}
          className={cn(
            controlClassName(Boolean(error)),
            "h-13 cursor-pointer appearance-none pr-12",
          )}
        >
          {placeholder !== undefined ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-graphit"
        >
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
}
