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
 * The application of /karriere and of every job page, BRIEF.md section 5
 * "Formen": one schema for the browser (hints while typing) and the server
 * (the final check). The error messages are keys of
 * ApplicationForm.errors in messages/*.json.
 */

/**
 * The trial day for pupils is not a job in Payload but a choice of the form,
 * as in ?stelle=schnuppertag. Every other choice is the id of an open job.
 */
export const TRIAL_DAY = "schnuppertag";

/** The query that chooses a job in the form: ?stelle=schnuppertag. */
export const JOB_PARAM = "stelle";

/** The labels are ApplicationForm.experiences.*. */
export const EXPERIENCES = [
  "experienced",
  "newly-qualified",
  "career-changer",
  "pupil",
] as const;

/** The labels are ApplicationForm.callTimes.*. */
export const CALL_TIMES = ["morning", "afternoon", "evening"] as const;

export const APPLICATION_ERROR_KEYS = [
  "jobMissing",
  "jobClosed",
  "nameMissing",
  "nameLong",
  "phoneMissing",
  "phoneInvalid",
  "emailInvalid",
  "experienceMissing",
  "startMissing",
  "startLong",
  "callTimeMissing",
  "messageLong",
] as const;

export type ApplicationErrorKey = (typeof APPLICATION_ERROR_KEYS)[number];

export const MESSAGE_MAX = 500;

const error = (key: ApplicationErrorKey) => ({ error: key });

/** A job's id as the form sends it: digits only, like Payload's ids. */
const JOB = new RegExp(`^(${TRIAL_DAY}|[1-9][0-9]{0,8})$`);

export const applicationSchema = z.object({
  job: z.string(error("jobMissing")).regex(JOB, error("jobMissing")),
  name: requiredText<ApplicationErrorKey>("nameMissing", "nameLong"),
  // A call is how it goes on, so the phone number is a must.
  phone: phoneNumber<ApplicationErrorKey>("phoneInvalid", "phoneMissing"),
  email: emailAddress<ApplicationErrorKey>("emailInvalid").optional(),
  experience: z.enum(EXPERIENCES, error("experienceMissing")),
  start: requiredText<ApplicationErrorKey>("startMissing", "startLong"),
  callTime: z.enum(CALL_TIMES, error("callTimeMissing")),
  message: optionalText<ApplicationErrorKey>("messageLong", MESSAGE_MAX),
});

export type ApplicationData = z.infer<typeof applicationSchema>;

export type ApplicationField = keyof ApplicationData;

/** The fields in the order they stand on the page. */
export const APPLICATION_FIELDS = [
  "job",
  "name",
  "phone",
  "email",
  "experience",
  "start",
  "callTime",
  "message",
] as const satisfies readonly ApplicationField[];

export type ApplicationErrors = Partial<
  Record<ApplicationField, ApplicationErrorKey>
>;

/** What the form sends: the fields, trimmed; an empty field is a missing one. */
export type ApplicationInput = Partial<Record<ApplicationField, string>>;

export const applicationInput = (formData: FormData): ApplicationInput =>
  formInput(formData, APPLICATION_FIELDS);

export type ApplicationResult =
  | { success: true; data: ApplicationData }
  | { success: false; errors: ApplicationErrors };

/** Checks the whole application, in the browser and on the server. */
export function validateApplication(
  input: ApplicationInput,
): ApplicationResult {
  const result = applicationSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: errorsOf(
      result.error.issues,
      APPLICATION_FIELDS,
      APPLICATION_ERROR_KEYS,
    ),
  };
}

/** The first field with an error, in the order of the page. */
export const firstApplicationError = (
  errors: ApplicationErrors,
): ApplicationField | null => firstErrorOf(errors, APPLICATION_FIELDS);

export const isApplicationField = (name: string): name is ApplicationField =>
  (APPLICATION_FIELDS as readonly string[]).includes(name);

/** What the application action answers; on success it redirects instead. */
export type ApplicationState = FormState<ApplicationErrors>;
