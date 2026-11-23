"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { sendMail } from "./mail";
import { buildRequestMail } from "./request-mail";
import {
  FILL_TIME_FIELD,
  MIN_FILL_TIME_MS,
  type RequestState,
  requestInput,
  TRAP_FIELD,
  validateRequest,
} from "./request-schema";

const thanks = (locale: Locale): never =>
  redirect({ href: "/anfrage/danke", locale });

/**
 * The request form's action, BRIEF.md section 5 "Formen". It checks
 * everything again on the server, because anyone can send this POST.
 *
 * - The trap field is filled or the form took under 3 seconds: a bot. It
 *   gets the thank-you page, so it learns nothing, and no mail goes out.
 * - No fill time: the browser ran no JavaScript, so the form cannot have
 *   gone through its steps. The visitor gets the phone number.
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
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  const trap = formData.get(TRAP_FIELD);
  if (typeof trap === "string" && trap !== "") {
    console.warn("[request] The trap field was filled in; nothing sent.");
    return thanks(locale);
  }

  const rawFillTime = formData.get(FILL_TIME_FIELD);
  const fillTime =
    typeof rawFillTime === "string" && rawFillTime.trim() !== ""
      ? Number(rawFillTime)
      : Number.NaN;
  if (!Number.isFinite(fillTime)) {
    console.warn("[request] Sent without the fill time; nothing sent.");
    return { status: "failed" };
  }
  if (fillTime < MIN_FILL_TIME_MS) {
    console.warn(`[request] Filled in ${fillTime} ms; nothing sent.`);
    return thanks(locale);
  }

  const result = validateRequest(requestInput(formData));
  if (!result.success) {
    return { status: "invalid", errors: result.errors };
  }

  try {
    await sendMail(buildRequestMail(result.data, locale));
  } catch (error) {
    console.error("[request] The mail could not be sent:", error);
    return { status: "failed" };
  }

  // Outside the try: redirect throws to do its work.
  return thanks(locale);
}
