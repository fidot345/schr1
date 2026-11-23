import { z } from "zod";
import {
  emailAddress,
  errorsOf,
  type FormState,
  firstErrorOf,
  formInput,
  optionalText,
  phoneNumber,
  requiredText,
} from "./form-schema";

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

const whatSchema = z.object({
  projectType: z.enum(PROJECT_TYPES, error("projectTypeMissing")),
  description: z
    .string(error("descriptionShort"))
    .trim()
    .min(DESCRIPTION_MIN, error("descriptionShort"))
    .max(DESCRIPTION_MAX, error("descriptionLong")),
  dimensions: optionalText<RequestErrorKey>("dimensionsLong", 200),
});

const whereSchema = z.object({
  postalCode: z
    .string(error("postalCodeInvalid"))
    .trim()
    .regex(/^\d{5}$/, error("postalCodeInvalid")),
  city: requiredText<RequestErrorKey>("cityMissing", "cityLong"),
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
    name: requiredText<RequestErrorKey>("nameMissing", "nameLong"),
    phone: phoneNumber<RequestErrorKey>("phoneInvalid").optional(),
    email: emailAddress<RequestErrorKey>("emailInvalid").optional(),
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
export const requestInput = (formData: FormData): RequestInput =>
  formInput(formData, REQUEST_FIELDS);

/** Checks the fields of one step only: the "Weiter" button and hints while typing. */
export function validateStep(
  step: RequestStep,
  input: RequestInput,
): RequestErrors {
  const result = REQUEST_STEPS[step - 1].safeParse(input);
  return result.success
    ? {}
    : errorsOf(result.error.issues, REQUEST_FIELDS, REQUEST_ERROR_KEYS);
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
  firstErrorOf(errors, REQUEST_FIELDS);

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

/** What the request action answers; on success it redirects instead. */
export type RequestState = FormState<RequestErrors>;
