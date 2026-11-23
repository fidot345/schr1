import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trySendMail } from "@/lib/form-action";
import {
  formatMail,
  MAIL_FROM,
  MAIL_TIMEOUT_MS,
  mailTransport,
  sendMail,
} from "@/lib/mail";
import { buildRequestMail } from "@/lib/request-mail";
import type { RequestData } from "@/lib/request-schema";

/*
 * Resend is replaced: no test needs a key, and no mail leaves the machine.
 * `keys` holds the key of every client made, `send` stands for
 * resend.emails.send.
 */
const resend = vi.hoisted(() => ({
  keys: [] as (string | undefined)[],
  send: vi.fn<
    (
      payload: Record<string, unknown>,
      options: { signal: AbortSignal },
    ) => Promise<unknown>
  >(),
}));

vi.mock("resend", () => ({
  Resend: class {
    readonly emails = { send: resend.send };
    constructor(key?: string) {
      resend.keys.push(key);
    }
  },
}));

beforeEach(() => {
  resend.keys.length = 0;
  resend.send.mockReset();
});

const REQUEST: RequestData = {
  projectType: "kueche",
  description: "Neue Küche für eine Altbauwohnung, L-Form, Eiche geölt.",
  dimensions: "3,40 m × 2,10 m",
  postalCode: "85999",
  city: "Wendelfing",
  timeframe: "3-6-months",
  budget: "10000-20000",
  name: "Anna Beispiel",
  phone: "089 99998 412",
  email: "anna@beispiel.example",
  contactPreference: "email",
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("mailTransport", () => {
  it("knows log and resend", () => {
    expect(mailTransport("log")).toBe("log");
    expect(mailTransport("resend")).toBe("resend");
  });

  it("refuses anything else, also nothing", () => {
    vi.stubEnv("MAIL_TRANSPORT", undefined);

    expect(() => mailTransport("smtp")).toThrow(/MAIL_TRANSPORT/);
    expect(() => mailTransport("")).toThrow(/MAIL_TRANSPORT/);
    expect(() => mailTransport(undefined)).toThrow(/MAIL_TRANSPORT/);
  });
});

describe("sendMail", () => {
  const message = {
    subject: "Neue Anfrage: Küche – 85999 Wendelfing",
    text: "Alle Felder",
    replyTo: "anna@beispiel.example",
  };

  it("writes the mail to the console with MAIL_TRANSPORT=log", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "log");
    vi.stubEnv("MAIL_TO", "maxon@posteingang.example");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendMail(message);

    expect(info).toHaveBeenCalledTimes(1);
    const [logged] = info.mock.calls[0];
    expect(logged).toContain("MAIL_TRANSPORT=log");
    expect(logged).toContain("To: maxon@posteingang.example");
    expect(logged).toContain("Reply-To: anna@beispiel.example");
    expect(logged).toContain("Subject: Neue Anfrage: Küche – 85999 Wendelfing");
    expect(logged).toContain("Alle Felder");
  });

  it("fails without a transport instead of pretending to send", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "");

    await expect(sendMail(message)).rejects.toThrow(/MAIL_TRANSPORT/);
  });

  it("sends nothing to Resend with MAIL_TRANSPORT=log", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "log");
    vi.spyOn(console, "info").mockImplementation(() => {});

    await sendMail(message);

    expect(resend.keys).toEqual([]);
    expect(resend.send).not.toHaveBeenCalled();
  });
});

describe("sendMail with MAIL_TRANSPORT=resend", () => {
  const KEY = "re_test_not_a_real_key";
  const message = {
    subject: "Neue Bewerbung: Schreiner (m/w/d) – Lukas Beispiel",
    text: "Alle Felder",
    replyTo: "lukas@beispiel.example",
  };

  beforeEach(() => {
    vi.stubEnv("MAIL_TRANSPORT", "resend");
    vi.stubEnv("RESEND_API_KEY", KEY);
    vi.stubEnv("MAIL_TO", "maxon@posteingang.example");
  });

  /** Sends and gives back the error's text; the test fails if nothing throws. */
  const failure = async () => {
    const error = await sendMail(message).then(
      () => expect.unreachable("sendMail did not fail"),
      (reason: unknown) => reason,
    );
    expect(error).toBeInstanceOf(Error);
    return (error as Error).message;
  };

  it("sends from onboarding@resend.dev to MAIL_TO, answering to the visitor", async () => {
    resend.send.mockResolvedValue({
      data: { id: "mail-1" },
      error: null,
      headers: null,
    });

    await sendMail(message);

    expect(resend.keys).toEqual([KEY]);
    expect(resend.send).toHaveBeenCalledTimes(1);
    const [payload, options] = resend.send.mock.calls[0];
    expect(payload).toEqual({
      from: MAIL_FROM,
      to: "maxon@posteingang.example",
      replyTo: "lukas@beispiel.example",
      subject: message.subject,
      text: message.text,
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("leaves Reply-To out when the visitor gave no address", async () => {
    resend.send.mockResolvedValue({
      data: { id: "mail-2" },
      error: null,
      headers: null,
    });

    await sendMail({ subject: "Betreff", text: "Text" });

    expect(resend.send.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });

  it("fails with Resend's reason when Resend refuses, without the key", async () => {
    resend.send.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        statusCode: 403,
        message: "You can only send testing emails to your own email address.",
      },
      headers: null,
    });

    const text = await failure();

    expect(text).toContain("validation_error");
    expect(text).toContain("403");
    expect(text).toContain("only send testing emails");
    expect(text).not.toContain(KEY);
  });

  it("fails when the request to Resend throws", async () => {
    resend.send.mockRejectedValue(new Error("fetch failed"));

    expect(await failure()).toContain("fetch failed");
  });

  it("gives up when Resend does not answer in time, and aborts the request", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    resend.send.mockImplementation((_payload, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });

    const result = failure();
    await vi.advanceTimersByTimeAsync(MAIL_TIMEOUT_MS);

    expect(await result).toMatch(/did not answer within 10 s/);
    expect(signal?.aborted).toBe(true);
  });

  it("fails without RESEND_API_KEY and does not call Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    expect(await failure()).toMatch(/RESEND_API_KEY is empty/);
    expect(resend.keys).toEqual([]);
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("fails without MAIL_TO and does not call Resend", async () => {
    vi.stubEnv("MAIL_TO", " ");

    expect(await failure()).toMatch(/MAIL_TO is empty/);
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("makes the form log the error, without the key, and show the phone", async () => {
    resend.send.mockResolvedValue({
      data: null,
      error: {
        name: "invalid_api_key",
        statusCode: 401,
        message: "API key is invalid",
      },
      headers: null,
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await trySendMail("request", message)).toBe(false);

    expect(logged).toHaveBeenCalledTimes(1);
    const line = logged.mock.calls[0].map(String).join(" ");
    expect(line).toContain("[request] The mail could not be sent");
    expect(line).toContain("invalid_api_key");
    expect(line).not.toContain(KEY);
  });
});

describe("formatMail", () => {
  it("sends from onboarding@resend.dev and leaves Reply-To out without an address", () => {
    const text = formatMail(
      { subject: "Betreff", text: "Text" },
      "an@x.example",
    );

    expect(MAIL_FROM).toContain("onboarding@resend.dev");
    expect(text).toContain(`From: ${MAIL_FROM}`);
    expect(text).not.toContain("Reply-To");
  });
});

describe("buildRequestMail", () => {
  it("names the kind of work and the place in the subject", () => {
    expect(buildRequestMail(REQUEST, "de").subject).toBe(
      "Neue Anfrage: Küche – 85999 Wendelfing",
    );
  });

  it("has every field in the body, with German labels", () => {
    const { text } = buildRequestMail(REQUEST, "de");

    for (const line of [
      "Sprache: Deutsch",
      "Was planen Sie?",
      "Art der Arbeit: Küche",
      REQUEST.description,
      "Ungefähre Maße: 3,40 m × 2,10 m",
      "Wo und wann?",
      "PLZ und Ort: 85999 Wendelfing",
      "Beginn: In 3–6 Monaten",
      "Budget: 10.000–20.000 €",
      "Wie erreichen wir Sie?",
      "Name: Anna Beispiel",
      "Telefon: 089 99998 412",
      "E-Mail: anna@beispiel.example",
      "Kontakt am liebsten: Per E-Mail",
    ]) {
      expect(text).toContain(line);
    }
  });

  it("answers to the visitor's e-mail address", () => {
    expect(buildRequestMail(REQUEST, "de").replyTo).toBe(
      "anna@beispiel.example",
    );
  });

  it("has no Reply-To and says what was left out without an address", () => {
    const { email: _email, dimensions: _dimensions, ...rest } = REQUEST;
    const mail = buildRequestMail(
      { ...rest, contactPreference: "phone" },
      "de",
    );

    expect(mail.replyTo).toBeUndefined();
    expect(mail.text).toContain("E-Mail: nicht angegeben");
    expect(mail.text).toContain("Ungefähre Maße: nicht angegeben");
  });

  it("stays German for a request from /en/request and names the language", () => {
    const mail = buildRequestMail(REQUEST, "en");

    expect(mail.subject).toBe("Neue Anfrage: Küche – 85999 Wendelfing");
    expect(mail.text).toContain("Sprache: Englisch");
  });
});
