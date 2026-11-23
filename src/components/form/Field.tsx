import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FieldError } from "./FieldError";

/** What a control needs from its Field: the id and the links to hint and error. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

type FieldProps = {
  /** Becomes the id of the control; the label, hint and error derive theirs from it. */
  id: string;
  label: string;
  /** Adds the "(optional)" next to the label. */
  optional?: boolean;
  hint?: string;
  /** The message under the control. A field with an error is marked invalid. */
  error?: string;
  className?: string;
  /** The control, given the props that tie it to the label, the hint and the error. */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * One field of a form, mockup 03: the label in bold, the hint below it in
 * Schiefer, the control, and the error with its icon. The "Fehler:" before
 * the error is read aloud only: the red color and the icon are not the only
 * sign, and the control is aria-invalid with the error in aria-describedby.
 */
export function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const t = useTranslations("Form");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-ui font-bold">
        {label}
        {optional && (
          <>
            {" "}
            <span className="font-normal text-schiefer">{t("optional")}</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-schiefer">
          {hint}
        </p>
      )}
      <div className="mt-2.5">
        {children({
          id,
          "aria-describedby": describedBy || undefined,
          "aria-invalid": error ? true : undefined,
        })}
      </div>
      {error && errorId ? (
        <FieldError id={errorId} message={error} className="mt-2" />
      ) : null}
    </div>
  );
}
