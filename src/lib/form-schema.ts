import { z } from "zod";

/*
 * What both forms share, BRIEF.md section 5 "Formen": the spam protection,
 * the rules for names, phone numbers and e-mail addresses, and how the
 * fields of a form and the errors of a check are read. The error messages
 * are message keys, so one rule reads well in both languages.
 */

/*
 * Spam protection without a third-party captcha: a trap field that people
 * never see (a bot fills it in) and the time from opening the form to
 * sending it. The browser measures that time itself, so a visitor's wrong
 * clock does not matter.
 */
export const TRAP_FIELD = "website";
export const FILL_TIME_FIELD = "fillTime";
export const MIN_FILL_TIME_MS = 3000;

const error = <Key extends string>(key: Key) => ({ error: key });

/** A text the visitor must give: trimmed, at least one character. */
export const requiredText = <Key extends string>(
  missing: Key,
  tooLong: Key,
  max = 100,
) =>
  z
    .string(error(missing))
    .trim()
    .min(1, error(missing))
    .max(max, error(tooLong));

/** A text the visitor may leave empty. */
export const optionalText = <Key extends string>(tooLong: Key, max: number) =>
  z.string().trim().max(max, error(tooLong)).optional();

/** Phone numbers as people write them: "089 99998 412", "+49 (89) 99998-412". */
const PHONE = /^\+?[0-9 ()/-]{6,30}$/;
const PHONE_MIN_DIGITS = 6;

/** `missing` is the error without a number, where the number is a must. */
export const phoneNumber = <Key extends string>(
  invalid: Key,
  missing: Key = invalid,
) =>
  z
    .string(error(missing))
    .trim()
    .min(1, error(missing))
    .regex(PHONE, error(invalid))
    .refine(
      (phone) => phone.replace(/\D/g, "").length >= PHONE_MIN_DIGITS,
      error(invalid),
    );

export const emailAddress = <Key extends string>(invalid: Key) =>
  z.email(error(invalid)).max(254, error(invalid));

/** The fields of a form, as strings; files and empty fields are left out. */
export function formInput<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Partial<Record<Field, string>> {
  const input: Partial<Record<Field, string>> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") {
      input[field] = value.trim();
    }
  }
  return input;
}

/** The first error of every field, for the fields and keys a form knows. */
export function errorsOf<Field extends string, Key extends string>(
  issues: z.ZodError["issues"],
  fields: readonly Field[],
  keys: readonly Key[],
): Partial<Record<Field, Key>> {
  const isField = (name: PropertyKey | undefined): name is Field =>
    typeof name === "string" && (fields as readonly string[]).includes(name);
  const isKey = (message: string): message is Key =>
    (keys as readonly string[]).includes(message);

  const errors: Partial<Record<Field, Key>> = {};
  for (const { path, message } of issues) {
    const [field] = path;
    if (isField(field) && errors[field] === undefined && isKey(message)) {
      errors[field] = message;
    }
  }
  return errors;
}

/** The first field with an error, in the order of the page. */
export const firstErrorOf = <Field extends string>(
  errors: Partial<Record<Field, string>>,
  fields: readonly Field[],
): Field | null => fields.find((field) => errors[field] !== undefined) ?? null;

/** What a form's action answers; on success it redirects instead. */
export type FormState<Errors> =
  | { status: "idle" }
  | { status: "invalid"; errors: Errors }
  | { status: "failed" };
