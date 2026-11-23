"use server";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formLocale, senderOf, trySendMail } from "./form-action";
import { buildRequestMail } from "./request-mail";
import {
  type RequestState,
  requestInput,
  validateRequest,
} from "./request-schema";

const thanks = (locale: Locale): never =>
  redirect({ href: "/anfrage/danke", locale });

/**
 * The request form's action, BRIEF.md section 5 "Formen". It checks
 * everything again on the server, because anyone can send this POST.
 *
 * - A bot (trap field, under 3 seconds) gets the thank-you page and no mail
 *   goes out; without JavaScript the visitor gets the phone number.
 * - Invalid fields: the errors go back to the form, as message keys.
 * - The mail fails: logged on the server; the visitor gets the phone number.
 * - Sent: the thank-you page.
 *
 * Nothing is stored: the request exists only in the mail.
 */
export async function submitRequest(
  requestedLocale: string,
  _previous: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const locale = formLocale(requestedLocale);

  const sender = senderOf(formData, "request");
  if (sender === "bot") {
    return thanks(locale);
  }
  if (sender === "noScript") {
    return { status: "failed" };
  }

  const result = validateRequest(requestInput(formData));
  if (!result.success) {
    return { status: "invalid", errors: result.errors };
  }

  if (!(await trySendMail("request", buildRequestMail(result.data, locale)))) {
    return { status: "failed" };
  }
  // Outside any try: redirect throws to do its work.
  return thanks(locale);
}
