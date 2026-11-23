import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/routing";
import de from "../../messages/de.json";
import type { ApplicationData } from "./application-schema";
import type { MailMessage } from "./mail";

/*
 * The mail of an application, BRIEF.md section 5 "Formen". It goes to the
 * workshop, so it is always German, also for one from /en/careers; the
 * language of the application is in the first line.
 */

const t = createTranslator({ locale: "de", messages: de });

/** The trial day under its German name, as the mail calls it. */
export const TRIAL_DAY_TITLE = t("ApplicationForm.trialDay");

/**
 * Subject "Neue Bewerbung: Schreiner (m/w/d) – Vorname Nachname", every
 * field in the body ("nicht angegeben" for an empty optional one), and the
 * applicant's e-mail, if they gave one, as Reply-To.
 *
 * `jobTitle` is the German title of the chosen job from Payload, or
 * "Schnuppertag / Praktikum".
 */
export function buildApplicationMail(
  application: ApplicationData,
  jobTitle: string,
  locale: Locale,
): MailMessage {
  const notGiven = t("ApplicationMail.notGiven");
  const line = (label: string, value: string | undefined) =>
    `${label}: ${value ?? notGiven}`;

  const text = [
    t("ApplicationMail.intro", {
      language: t(`ApplicationMail.languages.${locale}`),
    }),
    "",
    line(t("ApplicationMail.job"), jobTitle),
    line(t("ApplicationMail.name"), application.name),
    line(t("ApplicationMail.phone"), application.phone),
    line(t("ApplicationMail.email"), application.email),
    line(
      t("ApplicationMail.experience"),
      t(`ApplicationForm.experiences.${application.experience}`),
    ),
    line(t("ApplicationMail.start"), application.start),
    line(
      t("ApplicationMail.callTime"),
      t(`ApplicationForm.callTimes.${application.callTime}`),
    ),
    `${t("ApplicationMail.message")}:`,
    application.message ?? notGiven,
  ].join("\n");

  return {
    subject: t("ApplicationMail.subject", {
      job: jobTitle,
      name: application.name,
    }),
    text,
    ...(application.email ? { replyTo: application.email } : {}),
  };
}
