import { describe, expect, it } from "vitest";
import {
  APPLICATION_ERROR_KEYS,
  APPLICATION_FIELDS,
  applicationInput,
  CALL_TIMES,
  EXPERIENCES,
  firstApplicationError,
  MESSAGE_MAX,
  TRIAL_DAY,
  validateApplication,
} from "@/lib/application-schema";
import de from "../../messages/de.json";
import en from "../../messages/en.json";

const VALID = {
  job: "3",
  name: "Lukas Beispiel",
  phone: "0171 2345678",
  experience: "newly-qualified",
  start: "ab sofort",
  callTime: "afternoon",
};

const errorsOf = (input: Record<string, string>) => {
  const result = validateApplication(input);
  return result.success ? {} : result.errors;
};

describe("application schema", () => {
  it("accepts a complete application and returns it trimmed", () => {
    const result = validateApplication({
      ...VALID,
      name: "  Lukas Beispiel ",
      email: "lukas@beispiel.example",
      message: " Ich war zwei Jahre auf Montage. ",
    });

    expect(result).toEqual({
      success: true,
      data: {
        ...VALID,
        email: "lukas@beispiel.example",
        message: "Ich war zwei Jahre auf Montage.",
      },
    });
  });

  it("accepts an application without e-mail and message", () => {
    expect(validateApplication(VALID)).toEqual({ success: true, data: VALID });
  });

  it("names every missing required field, in the order of the page", () => {
    const errors = errorsOf({});

    expect(errors).toEqual({
      job: "jobMissing",
      name: "nameMissing",
      phone: "phoneMissing",
      experience: "experienceMissing",
      start: "startMissing",
      callTime: "callTimeMissing",
    });
    expect(firstApplicationError(errors)).toBe("job");
    expect(firstApplicationError({ callTime: "callTimeMissing" })).toBe(
      "callTime",
    );
    expect(firstApplicationError({})).toBeNull();
  });

  it("takes an open job's id or the trial day as the job", () => {
    for (const job of ["1", "42", TRIAL_DAY]) {
      expect(errorsOf({ ...VALID, job }), job).toEqual({});
    }
    for (const job of ["0", "-1", "3a", "Schreiner", "1234567890"]) {
      expect(errorsOf({ ...VALID, job }), job).toEqual({ job: "jobMissing" });
    }
  });

  it("wants a phone number, and a real one", () => {
    expect(errorsOf({ ...VALID, phone: "" })).toEqual({
      phone: "phoneMissing",
    });
    expect(errorsOf({ ...VALID, phone: "anrufen" })).toEqual({
      phone: "phoneInvalid",
    });
    expect(errorsOf({ ...VALID, phone: "12 34" })).toEqual({
      phone: "phoneInvalid",
    });
    expect(errorsOf({ ...VALID, phone: "+49 (89) 99998-412" })).toEqual({});
  });

  it("checks an e-mail address that is given", () => {
    expect(errorsOf({ ...VALID, email: "lukas@" })).toEqual({
      email: "emailInvalid",
    });
  });

  it("only takes the offered choices", () => {
    for (const experience of EXPERIENCES) {
      expect(errorsOf({ ...VALID, experience })).toEqual({});
    }
    for (const callTime of CALL_TIMES) {
      expect(errorsOf({ ...VALID, callTime })).toEqual({});
    }
    expect(
      errorsOf({ ...VALID, experience: "Meister", callTime: "nachts" }),
    ).toEqual({
      experience: "experienceMissing",
      callTime: "callTimeMissing",
    });
  });

  it("caps the message at 500 characters and the short texts at 100", () => {
    expect(errorsOf({ ...VALID, message: "a".repeat(MESSAGE_MAX) })).toEqual(
      {},
    );
    expect(
      errorsOf({
        ...VALID,
        message: "a".repeat(MESSAGE_MAX + 1),
        name: "a".repeat(101),
        start: "a".repeat(101),
      }),
    ).toEqual({
      name: "nameLong",
      start: "startLong",
      message: "messageLong",
    });
  });
});

describe("applicationInput", () => {
  it("takes the application's fields as trimmed strings, without empty ones", () => {
    const formData = new FormData();
    formData.set("job", TRIAL_DAY);
    formData.set("name", "  Mia Beispiel ");
    formData.set("email", "   ");
    formData.set("website", "spam");
    formData.set("message", new Blob(["file"]));

    expect(applicationInput(formData)).toEqual({
      job: TRIAL_DAY,
      name: "Mia Beispiel",
    });
  });
});

describe("application texts", () => {
  it("has every error message in German and in English", () => {
    for (const messages of [de, en]) {
      expect(Object.keys(messages.ApplicationForm.errors).sort()).toEqual(
        [...APPLICATION_ERROR_KEYS].sort(),
      );
      for (const key of APPLICATION_ERROR_KEYS) {
        expect(messages.ApplicationForm.errors[key], key).toBeTruthy();
      }
    }
  });

  it("has a label for every choice in both languages", () => {
    for (const messages of [de, en]) {
      expect(Object.keys(messages.ApplicationForm.experiences)).toEqual([
        ...EXPERIENCES,
      ]);
      expect(Object.keys(messages.ApplicationForm.callTimes)).toEqual([
        ...CALL_TIMES,
      ]);
    }
  });

  it("uses the words of the brief in German", () => {
    const form = de.ApplicationForm;

    expect(form.title).toBe("In 60 Sekunden bewerben – ohne Lebenslauf");
    expect(form.submit).toBe("Bewerbung abschicken");
    expect(form.trialDay).toBe("Schnuppertag / Praktikum");
    expect(Object.values(form.experiences)).toEqual([
      "Ausgelernt mit Berufserfahrung",
      "Gerade ausgelernt",
      "Quereinstieg",
      "Schüler:in",
    ]);
    expect(Object.values(form.callTimes)).toEqual([
      "Vormittags",
      "Nachmittags",
      "Abends",
    ]);
  });

  it("speaks to the applicant with du in German", () => {
    const texts = [
      ...Object.values(de.ApplicationForm.errors),
      de.ApplicationForm.privacy,
      de.Form.sendFailed.informal,
      de.Form.sendFailed.noPhoneInformal,
    ].join(" ");

    expect(texts).not.toMatch(/\b(Sie|Ihre?n?)\b/);
  });

  it("has the fields in the order of the brief", () => {
    expect(APPLICATION_FIELDS).toEqual([
      "job",
      "name",
      "phone",
      "email",
      "experience",
      "start",
      "callTime",
      "message",
    ]);
  });
});
