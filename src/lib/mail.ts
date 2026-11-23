/*
 * Sending the mails of the forms, BRIEF.md section 5 "Formen". Server only.
 *
 * MAIL_TRANSPORT=log     the mail is written to the server console, nothing
 *                        is sent; development and tests work like this
 * MAIL_TRANSPORT=resend  sent with Resend from onboarding@resend.dev to
 *                        MAIL_TO, Maxon's address
 *
 * Any other value, or none, is an error: a form must not look sent when
 * nothing went out.
 */

export type MailMessage = {
  subject: string;
  /** The body as plain text. */
  text: string;
  /** The visitor's address, if they gave one: "Reply" goes to them. */
  replyTo?: string;
};

export const MAIL_FROM = "Schreinerei Tannrieder <onboarding@resend.dev>";

export type MailTransport = "log" | "resend";

export function mailTransport(
  value = process.env.MAIL_TRANSPORT,
): MailTransport {
  if (value === "log" || value === "resend") {
    return value;
  }
  throw new Error(
    `MAIL_TRANSPORT must be "log" or "resend", not ${JSON.stringify(value ?? "")}.`,
  );
}

/** The mail as text, the way the log transport prints it. */
export function formatMail(message: MailMessage, to: string): string {
  return [
    `From: ${MAIL_FROM}`,
    `To: ${to}`,
    ...(message.replyTo ? [`Reply-To: ${message.replyTo}`] : []),
    `Subject: ${message.subject}`,
    "",
    message.text,
  ].join("\n");
}

function logMail(message: MailMessage) {
  const to = process.env.MAIL_TO || "(MAIL_TO is not set)";
  console.info(
    `[mail] Not sent (MAIL_TRANSPORT=log):\n${formatMail(message, to)}`,
  );
}

/**
 * TEMP(stage-4): Resend and its key come in session 32. Until then the
 * transport fails, so the form shows the phone number instead of a false
 * "thank you".
 */
async function sendWithResend(_message: MailMessage): Promise<void> {
  throw new Error("MAIL_TRANSPORT=resend is not set up yet.");
}

/** Sends the mail, or writes it to the console with MAIL_TRANSPORT=log. Throws when it fails. */
export async function sendMail(message: MailMessage): Promise<void> {
  if (mailTransport() === "log") {
    logMail(message);
    return;
  }
  await sendWithResend(message);
}
