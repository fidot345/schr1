import { describe, expect, it } from "vitest";
import { buildApplicationMail, TRIAL_DAY_TITLE } from "@/lib/application-mail";
import type { ApplicationData } from "@/lib/application-schema";

const APPLICATION: ApplicationData = {
  job: "1",
  name: "Lukas Beispiel",
  phone: "0171 2345678",
  email: "lukas@beispiel.example",
  experience: "experienced",
  start: "nach drei Monaten Kündigungsfrist",
  callTime: "evening",
  message: "Ich habe fünf Jahre Küchen montiert.",
};

describe("buildApplicationMail", () => {
  it("has the subject of the brief and every field in German", () => {
    const mail = buildApplicationMail(APPLICATION, "Schreiner (m/w/d)", "de");

    expect(mail.subject).toBe(
      "Neue Bewerbung: Schreiner (m/w/d) – Lukas Beispiel",
    );
    expect(mail.text).toBe(
      [
        "Neue Bewerbung über das Formular auf der Website. Sprache: Deutsch.",
        "",
        "Stelle: Schreiner (m/w/d)",
        "Name: Lukas Beispiel",
        "Telefon: 0171 2345678",
        "E-Mail: lukas@beispiel.example",
        "Erfahrung: Ausgelernt mit Berufserfahrung",
        "Anfangen ab: nach drei Monaten Kündigungsfrist",
        "Anruf am liebsten: Abends",
        "Nachricht:",
        "Ich habe fünf Jahre Küchen montiert.",
      ].join("\n"),
    );
  });

  it("answers to the applicant's e-mail address", () => {
    expect(
      buildApplicationMail(APPLICATION, "Schreiner (m/w/d)", "de").replyTo,
    ).toBe("lukas@beispiel.example");
  });

  it("says what was not given and has no Reply-To without e-mail", () => {
    const { email: _email, message: _message, ...rest } = APPLICATION;
    const mail = buildApplicationMail(
      { ...rest, job: "schnuppertag", experience: "pupil" },
      TRIAL_DAY_TITLE,
      "de",
    );

    expect(mail.subject).toBe(
      "Neue Bewerbung: Schnuppertag / Praktikum – Lukas Beispiel",
    );
    expect(mail.text).toContain("E-Mail: nicht angegeben");
    expect(mail.text).toContain("Erfahrung: Schüler:in");
    expect(mail.text).toMatch(/Nachricht:\nnicht angegeben$/);
    expect(mail).not.toHaveProperty("replyTo");
  });

  it("stays German for an application from the English page", () => {
    const mail = buildApplicationMail(
      { ...APPLICATION, callTime: "morning" },
      "Monteur für Möbel und Küchen (m/w/d)",
      "en",
    );

    expect(mail.subject).toBe(
      "Neue Bewerbung: Monteur für Möbel und Küchen (m/w/d) – Lukas Beispiel",
    );
    expect(mail.text).toMatch(/^Neue Bewerbung .* Sprache: Englisch\.\n/);
    expect(mail.text).toContain("Anruf am liebsten: Vormittags");
  });
});
