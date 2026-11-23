import { hasLocale } from "next-intl";
import { type Locale, routing } from "@/i18n/routing";
import { FILL_TIME_FIELD, MIN_FILL_TIME_MS, TRAP_FIELD } from "./form-schema";
import { type MailMessage, sendMail } from "./mail";

/*
 * What the actions of both forms share, BRIEF.md section 5 "Formen". Server
 * only; `tag` names the form in the server log: "[request]", "[application]".
 */

/** The language the form was sent in; German for one the site does not know. */
export const formLocale = (requested: string): Locale =>
  hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

/**
 * Who sent the form, from the spam protection:
 *
 * - "bot": the trap field is filled or the form took under 3 seconds. The
 *   action thanks it all the same, so it learns nothing, and sends no mail.
 * - "noScript": no fill time, so the browser ran no JavaScript and the
 *   form's own checks did not run. The visitor gets the phone number.
 * - "person": the fields are checked next.
 */
export function senderOf(
  formData: FormData,
  tag: string,
): "person" | "bot" | "noScript" {
  const trap = formData.get(TRAP_FIELD);
  if (typeof trap === "string" && trap !== "") {
    console.warn(`[${tag}] The trap field was filled in; nothing sent.`);
    return "bot";
  }

  const rawFillTime = formData.get(FILL_TIME_FIELD);
  const fillTime =
    typeof rawFillTime === "string" && rawFillTime.trim() !== ""
      ? Number(rawFillTime)
      : Number.NaN;
  if (!Number.isFinite(fillTime)) {
    console.warn(`[${tag}] Sent without the fill time; nothing sent.`);
    return "noScript";
  }
  if (fillTime < MIN_FILL_TIME_MS) {
    console.warn(`[${tag}] Filled in ${fillTime} ms; nothing sent.`);
    return "bot";
  }
  return "person";
}

/**
 * Sends the mail of a form. When that fails, the error goes to the server
 * log and the answer is false: the visitor then gets the phone number.
 */
export async function trySendMail(
  tag: string,
  message: MailMessage,
): Promise<boolean> {
  try {
    await sendMail(message);
    return true;
  } catch (error) {
    console.error(`[${tag}] The mail could not be sent:`, error);
    return false;
  }
}
