import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/routing";
import de from "../../messages/de.json";
import type { MailMessage } from "./mail";
import type { RequestData } from "./request-schema";

/*
 * The mail of a request, BRIEF.md section 5 "Formen". It goes to the
 * workshop, so it is always German, also for a request from /en/request;
 * the language of the request is in the first line.
 */

const t = createTranslator({ locale: "de", messages: de });

/**
 * Subject "Neue Anfrage: Küche – 85999 Wendelfing", every field in the body
 * ("nicht angegeben" for an empty optional one), and the visitor's e-mail,
 * if they gave one, as Reply-To.
 */
export function buildRequestMail(
  request: RequestData,
  locale: Locale,
): MailMessage {
  const type = t(`RequestForm.types.${request.projectType}`);
  const notGiven = t("RequestMail.notGiven");
  const line = (label: string, value: string | undefined) =>
    `${label}: ${value ?? notGiven}`;

  const text = [
    t("RequestMail.intro", { language: t(`RequestMail.languages.${locale}`) }),
    "",
    t("RequestForm.steps.what"),
    line(t("RequestMail.projectType"), type),
    `${t("RequestMail.description")}:`,
    request.description,
    line(t("RequestMail.dimensions"), request.dimensions),
    "",
    t("RequestForm.steps.where"),
    line(t("RequestMail.place"), `${request.postalCode} ${request.city}`),
    line(
      t("RequestMail.timeframe"),
      t(`RequestForm.timeframes.${request.timeframe}`),
    ),
    line(t("RequestMail.budget"), t(`RequestForm.budgets.${request.budget}`)),
    "",
    t("RequestForm.steps.contact"),
    line(t("RequestMail.name"), request.name),
    line(t("RequestMail.phone"), request.phone),
    line(t("RequestMail.email"), request.email),
    line(
      t("RequestMail.contactPreference"),
      t(`RequestForm.preferences.${request.contactPreference}`),
    ),
  ].join("\n");

  return {
    subject: t("RequestMail.subject", {
      type,
      postalCode: request.postalCode,
      city: request.city,
    }),
    text,
    ...(request.email ? { replyTo: request.email } : {}),
  };
}
