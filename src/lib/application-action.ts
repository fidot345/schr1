"use server";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildApplicationMail, TRIAL_DAY_TITLE } from "./application-mail";
import {
  type ApplicationState,
  applicationInput,
  TRIAL_DAY,
  validateApplication,
} from "./application-schema";
import { getOpenJobs } from "./content";
import { formLocale, senderOf, trySendMail } from "./form-action";

const thanks = (locale: Locale): never =>
  redirect({ href: "/karriere/danke", locale });

/**
 * The German title of the chosen job, for the mail; null when the job is no
 * longer open (switched off while the form was open).
 */
async function jobTitleOf(job: string): Promise<string | null> {
  if (job === TRIAL_DAY) {
    return TRIAL_DAY_TITLE;
  }
  const open = await getOpenJobs("de");
  return open.find(({ id }) => String(id) === job)?.title ?? null;
}

/**
 * The application form's action, BRIEF.md section 5 "Formen". It checks
 * everything again on the server, because anyone can send this POST.
 *
 * - A bot (trap field, under 3 seconds) gets the thank-you page and no mail
 *   goes out; without JavaScript the visitor gets the phone number.
 * - Invalid fields, or a job that is no longer open: the errors go back to
 *   the form, as message keys.
 * - The jobs cannot be read or the mail fails: logged on the server; the
 *   visitor gets the phone number.
 * - Sent: the thank-you page.
 *
 * Nothing is stored: the application exists only in the mail.
 */
export async function submitApplication(
  requestedLocale: string,
  _previous: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const locale = formLocale(requestedLocale);

  const sender = senderOf(formData, "application");
  if (sender === "bot") {
    return thanks(locale);
  }
  if (sender === "noScript") {
    return { status: "failed" };
  }

  const result = validateApplication(applicationInput(formData));
  if (!result.success) {
    return { status: "invalid", errors: result.errors };
  }

  let jobTitle: string | null;
  try {
    jobTitle = await jobTitleOf(result.data.job);
  } catch (error) {
    console.error("[application] The open jobs could not be read:", error);
    return { status: "failed" };
  }
  if (jobTitle === null) {
    return { status: "invalid", errors: { job: "jobClosed" } };
  }

  const mail = buildApplicationMail(result.data, jobTitle, locale);
  if (!(await trySendMail("application", mail))) {
    return { status: "failed" };
  }
  // Outside any try: redirect throws to do its work.
  return thanks(locale);
}
