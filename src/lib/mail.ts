import { Resend } from "resend";

/*
 * Sending the mails of the forms, BRIEF.md section 5 "Formen". Server only.
 *
 * MAIL_TRANSPORT=log     the mail is written to the server console, nothing
 *                        is sent; development and tests work like this
 * MAIL_TRANSPORT=resend  sent with Resend from onboarding@resend.dev to
 *                        MAIL_TO, Maxon's address; needs RESEND_API_KEY
 *
 * Any other value, or none, is an error: a form must not look sent when
 * nothing went out. So is a missing key or MAIL_TO with resend, a refusal
 * from Resend and no answer within MAIL_TIMEOUT_MS. The errors never hold
 * the key; the form's action logs them and shows the visitor the phone.
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

/** How long the visitor waits for Resend at most before getting the phone. */
export const MAIL_TIMEOUT_MS = 10_000;

/**
 * Runs `send` and gives up after `ms`: the signal aborts the request and the
 * answer is an error, even if the request ignores the signal.
 */
async function withTimeout<T>(
  send: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Resend did not answer within ${ms / 1000} s.`));
    }, ms);
  });
  try {
    return await Promise.race([send(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function sendWithResend(message: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.MAIL_TO?.trim();
  if (!apiKey) {
    throw new Error("MAIL_TRANSPORT=resend, but RESEND_API_KEY is empty.");
  }
  if (!to) {
    throw new Error("MAIL_TRANSPORT=resend, but MAIL_TO is empty.");
  }

  const resend = new Resend(apiKey);
  const { error } = await withTimeout(
    (signal) =>
      resend.emails.send(
        {
          from: MAIL_FROM,
          to,
          ...(message.replyTo ? { replyTo: message.replyTo } : {}),
          subject: message.subject,
          text: message.text,
        },
        { signal },
      ),
    MAIL_TIMEOUT_MS,
  );
  if (error) {
    throw new Error(
      `Resend did not send the mail: ${error.name} (status ${error.statusCode ?? "none"}): ${error.message}`,
    );
  }
}

/** Sends the mail, or writes it to the console with MAIL_TRANSPORT=log. Throws when it fails. */
export async function sendMail(message: MailMessage): Promise<void> {
  if (mailTransport() === "log") {
    logMail(message);
    return;
  }
  await sendWithResend(message);
}
