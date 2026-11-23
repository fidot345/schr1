import { z } from "zod";

/*
 * The request form of /anfrage, BRIEF.md section 5 "Formen": one schema for
 * the browser (hints while typing) and the server (the final check). The
 * error messages are keys of RequestForm.errors in messages/*.json, so both
 * languages read the same rules.
 */

/** Kinds of work, as in ?typ=kueche. The labels are RequestForm.types.*. */
export const PROJECT_TYPES = [
  "kueche",
  "schrank",
  "tueren",
  "ausbau",
  "anderes",
] as const;

export const TIMEFRAMES = [
  "asap",
  "1-3-months",
  "3-6-months",
  "later",
] as const;

export const BUDGETS = [
  "up-to-5000",
  "5000-10000",
  "10000-20000",
  "over-20000",
  "unknown",
] as const;

export const CONTACT_PREFERENCES = ["phone", "email", "any"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const REQUEST_ERROR_KEYS = [
  "projectTypeMissing",
  "descriptionShort",
  "descriptionLong",
  "dimensionsLong",
  "postalCodeInvalid",
  "cityMissing",
  "cityLong",
  "timeframeMissing",
  "budgetMissing",
  "nameMissing",
  "nameLong",
  "phoneInvalid",
  "emailInvalid",
  "contactMissing",
  "phoneForCall",
  "emailForMail",
  "contactPreferenceMissing",
] as const;

export type RequestErrorKey = (typeof REQUEST_ERROR_KEYS)[number];

export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;

const error = (key: RequestErrorKey) => ({ error: key });

/** A text the visitor must give: trimmed, at least one character. */
const requiredText = (missing: RequestErrorKey, tooLong: RequestErrorKey) =>
  z
    .string(error(missing))
    .trim()
    .min(1, error(missing))
    .max(100, error(tooLong));

/** Phone numbers as people write them: "089 99998 412", "+49 (89) 99998-412". */
const PHONE = /^\+?[0-9 ()/-]{6,30}$/;
const PHONE_MIN_DIGITS = 6;

const whatSchema = z.object({
  projectType: z.enum(PROJECT_TYPES, error("projectTypeMissing")),
  description: z
    .string(error("descriptionShort"))
    .trim()
    .min(DESCRIPTION_MIN, error("descriptionShort"))
    .max(DESCRIPTION_MAX, error("descriptionLong")),
  dimensions: z.string().trim().max(200, error("dimensionsLong")).optional(),
});

const whereSchema = z.object({
  postalCode: z
    .string(error("postalCodeInvalid"))
    .trim()
    .regex(/^\d{5}$/, error("postalCodeInvalid")),
  city: requiredText("cityMissing", "cityLong"),
  timeframe: z.enum(TIMEFRAMES, error("timeframeMissing")),
  budget: z.enum(BUDGETS, error("budgetMissing")),
});

/** A rule across the contact fields, with its error on one of them. */
const contactRule = (
  field: "phone" | "email",
  key: RequestErrorKey,
): { path: string[]; error: RequestErrorKey; when: () => boolean } => ({
  path: [field],
  error: key,
  when: () => true,
});

const contactSchema = z
  .object({
    name: requiredText("nameMissing", "nameLong"),
    phone: z
      .string()
      .trim()
      .regex(PHONE, error("phoneInvalid"))
      .refine(
        (phone) => phone.replace(/\D/g, "").length >= PHONE_MIN_DIGITS,
        error("phoneInvalid"),
      )
      .optional(),
    email: z
      .email(error("emailInvalid"))
      .max(254, error("emailInvalid"))
      .optional(),
    contactPreference: z.enum(
      CONTACT_PREFERENCES,
      error("contactPreferenceMissing"),
    ),
  })
  // Phone or e-mail, at least one; and the one they want us to use. Only one
  // of the three applies at a time. `when` runs them also while another
  // field is wrong, so the step shows all its errors at once.
  .refine(
    ({ phone, email }) => phone !== undefined || email !== undefined,
    contactRule("phone", "contactMissing"),
  )
  .refine(
    ({ phone, email, contactPreference }) =>
      !(contactPreference === "phone" && phone === undefined && email),
    contactRule("phone", "phoneForCall"),
  )
  .refine(
    ({ phone, email, contactPreference }) =>
      !(contactPreference === "email" && email === undefined && phone),
    contactRule("email", "emailForMail"),
  );

/** The three steps of the form, in order. */
export const REQUEST_STEPS = [whatSchema, whereSchema, contactSchema] as const;

export type RequestStep = 1 | 2 | 3;

export const requestSchema = z.object({
  ...whatSchema.shape,
  ...whereSchema.shape,
  ...contactSchema.shape,
});

export type RequestData = z.infer<typeof whatSchema> &
  z.infer<typeof whereSchema> &
  z.infer<typeof contactSchema>;

export type RequestField = keyof RequestData;

/** The fields of each step, in the order they stand on the page. */
export const STEP_FIELDS = {
  1: ["projectType", "description", "dimensions"],
  2: ["postalCode", "city", "timeframe", "budget"],
  3: ["name", "phone", "email", "contactPreference"],
} as const satisfies Record<RequestStep, readonly RequestField[]>;

export const REQUEST_FIELDS: readonly RequestField[] = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
];

export type RequestErrors = Partial<Record<RequestField, RequestErrorKey>>;

export type ValidationResult =
  | { success: true; data: RequestData }
  | { success: false; errors: RequestErrors };

/** What the form sends: the fields, trimmed; an empty field is a missing one. */
export type RequestInput = Partial<Record<RequestField, string>>;

/** The request's fields from a form, as strings; files and empty fields are left out. */
export function requestInput(formData: FormData): RequestInput {
  const input: RequestInput = {};
  for (const field of REQUEST_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") {
      input[field] = value.trim();
    }
  }
  return input;
}

const isErrorKey = (message: string): message is RequestErrorKey =>
  (REQUEST_ERROR_KEYS as readonly string[]).includes(message);

const isField = (name: PropertyKey | undefined): name is RequestField =>
  typeof name === "string" &&
  (REQUEST_FIELDS as readonly string[]).includes(name);

/** The first error of every field. */
function errorsOf(issues: z.ZodError["issues"]): RequestErrors {
  const errors: RequestErrors = {};
  for (const { path, message } of issues) {
    const [field] = path;
    if (isField(field) && errors[field] === undefined && isErrorKey(message)) {
      errors[field] = message;
    }
  }
  return errors;
}

/** Checks the fields of one step only: the "Weiter" button and hints while typing. */
export function validateStep(
  step: RequestStep,
  input: RequestInput,
): RequestErrors {
  const result = REQUEST_STEPS[step - 1].safeParse(input);
  return result.success ? {} : errorsOf(result.error.issues);
}

/** Checks the whole request, as the server does before it sends the mail. */
export function validateRequest(input: RequestInput): ValidationResult {
  const errors: RequestErrors = {
    ...validateStep(1, input),
    ...validateStep(2, input),
    ...validateStep(3, input),
  };
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: requestSchema.parse(input) };
}

/** The step a field belongs to. */
export const stepOf = (field: RequestField): RequestStep =>
  (STEP_FIELDS[1] as readonly RequestField[]).includes(field)
    ? 1
    : (STEP_FIELDS[2] as readonly RequestField[]).includes(field)
      ? 2
      : 3;

/** The first field with an error, in the order of the page. */
export const firstErrorField = (errors: RequestErrors): RequestField | null =>
  REQUEST_FIELDS.find((field) => errors[field] !== undefined) ?? null;

export const isProjectType = (value: unknown): value is ProjectType =>
  typeof value === "string" &&
  (PROJECT_TYPES as readonly string[]).includes(value);

/**
 * The kind of work behind each service page, by its German slug (decision
 * by Maxon, session 30: no field in Payload). A service whose slug is not
 * here, or was renamed, opens the form with nothing chosen.
 */
const PROJECT_TYPE_BY_SERVICE: Record<string, ProjectType> = {
  kuechen: "kueche",
  "schraenke-und-moebel": "schrank",
  tueren: "tueren",
  innenausbau: "ausbau",
};

export const projectTypeOfService = (germanSlug: string): ProjectType | null =>
  PROJECT_TYPE_BY_SERVICE[germanSlug] ?? null;

/*
 * Spam protection without a third-party captcha, BRIEF.md section 5: a trap
 * field that people never see (a bot fills it in) and the time from opening
 * the form to sending it. The browser measures that time itself, so a
 * visitor's wrong clock does not matter.
 */
export const TRAP_FIELD = "website";
export const FILL_TIME_FIELD = "fillTime";
export const MIN_FILL_TIME_MS = 3000;

/** What the request action answers; on success it redirects instead. */
export type RequestState =
  | { status: "idle" }
  | { status: "invalid"; errors: RequestErrors }
  | { status: "failed" };
