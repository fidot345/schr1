import { afterEach, describe, expect, it, vi } from "vitest";
import { formatMail, MAIL_FROM, mailTransport, sendMail } from "@/lib/mail";
import { buildRequestMail } from "@/lib/request-mail";
import type { RequestData } from "@/lib/request-schema";

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
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("mailTransport", () => {
  it("knows log and resend", () => {
    expect(mailTransport("log")).toBe("log");
    expect(mailTransport("resend")).toBe("resend");
  });

  it("refuses anything else, also nothing", () => {
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

  it("fails while Resend is not set up, so the form shows the phone", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "resend");

    await expect(sendMail(message)).rejects.toThrow(/resend/);
  });

  it("fails without a transport instead of pretending to send", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "");

    await expect(sendMail(message)).rejects.toThrow(/MAIL_TRANSPORT/);
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
