import { describe, expect, it } from "vitest";
import {
  BUDGETS,
  CONTACT_PREFERENCES,
  firstErrorField,
  isProjectType,
  PROJECT_TYPES,
  projectTypeOfService,
  REQUEST_ERROR_KEYS,
  REQUEST_FIELDS,
  type RequestInput,
  requestInput,
  STEP_FIELDS,
  stepOf,
  TIMEFRAMES,
  validateRequest,
  validateStep,
} from "@/lib/request-schema";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { services } from "../../seed/data";

/** A request that passes, to change one field at a time. */
const VALID: RequestInput = {
  projectType: "schrank",
  description: "Einbauschrank fürs Schlafzimmer, Wand 3,20 m breit.",
  dimensions: "320 × 250 × 60 cm",
  postalCode: "85999",
  city: "Wendelfing",
  timeframe: "1-3-months",
  budget: "5000-10000",
  name: "Anna Beispiel",
  phone: "089 99998 412",
  email: "anna@beispiel.example",
  contactPreference: "phone",
};

const errorsOf = (input: RequestInput) => {
  const result = validateRequest(input);
  return result.success ? {} : result.errors;
};

describe("request schema", () => {
  it("accepts a complete request and returns it trimmed", () => {
    const result = validateRequest({ ...VALID, city: "  Wendelfing  " });

    expect(result.success).toBe(true);
    expect(result.success && result.data.city).toBe("Wendelfing");
  });

  it("accepts a request without the optional fields", () => {
    const { dimensions: _dimensions, email: _email, ...rest } = VALID;

    expect(validateRequest(rest).success).toBe(true);
  });

  it("names every missing required field", () => {
    expect(errorsOf({})).toEqual({
      projectType: "projectTypeMissing",
      description: "descriptionShort",
      postalCode: "postalCodeInvalid",
      city: "cityMissing",
      timeframe: "timeframeMissing",
      budget: "budgetMissing",
      name: "nameMissing",
      phone: "contactMissing",
      contactPreference: "contactPreferenceMissing",
    });
  });

  it("wants a description of 20 to 1000 characters", () => {
    expect(errorsOf({ ...VALID, description: "Ein Schrank" })).toEqual({
      description: "descriptionShort",
    });
    // Spaces around do not count.
    expect(
      errorsOf({ ...VALID, description: `   ${"a".repeat(19)}   ` }),
    ).toEqual({ description: "descriptionShort" });
    expect(errorsOf({ ...VALID, description: "a".repeat(20) })).toEqual({});
    expect(errorsOf({ ...VALID, description: "a".repeat(1000) })).toEqual({});
    expect(errorsOf({ ...VALID, description: "a".repeat(1001) })).toEqual({
      description: "descriptionLong",
    });
  });

  it("wants exactly five digits as postal code", () => {
    for (const postalCode of ["8599", "859990", "8599a", "85 99"]) {
      expect(errorsOf({ ...VALID, postalCode }), postalCode).toEqual({
        postalCode: "postalCodeInvalid",
      });
    }
    expect(errorsOf({ ...VALID, postalCode: "01067" })).toEqual({});
  });

  it("only takes the offered choices", () => {
    expect(errorsOf({ ...VALID, projectType: "garage" })).toEqual({
      projectType: "projectTypeMissing",
    });
    expect(errorsOf({ ...VALID, timeframe: "morgen" })).toEqual({
      timeframe: "timeframeMissing",
    });
    expect(errorsOf({ ...VALID, budget: "1000000" })).toEqual({
      budget: "budgetMissing",
    });
    expect(errorsOf({ ...VALID, contactPreference: "fax" })).toEqual({
      contactPreference: "contactPreferenceMissing",
    });
  });

  it("checks phone numbers and e-mail addresses that are given", () => {
    for (const phone of ["12345", "089 abc 412", "0".repeat(31)]) {
      expect(errorsOf({ ...VALID, phone }), phone).toEqual({
        phone: "phoneInvalid",
      });
    }
    for (const phone of ["+49 (89) 99998-412", "089/99998412"]) {
      expect(errorsOf({ ...VALID, phone }), phone).toEqual({});
    }
    expect(errorsOf({ ...VALID, email: "anna.beispiel" })).toEqual({
      email: "emailInvalid",
    });
  });

  it("wants a phone number or an e-mail address, and the preferred one", () => {
    const { phone: _phone, email: _email, ...noContact } = VALID;

    expect(errorsOf({ ...noContact, contactPreference: "any" })).toEqual({
      phone: "contactMissing",
    });
    expect(errorsOf({ ...noContact, email: "anna@beispiel.example" })).toEqual({
      phone: "phoneForCall",
    });
    expect(
      errorsOf({
        ...noContact,
        phone: "089 99998 412",
        contactPreference: "email",
      }),
    ).toEqual({ email: "emailForMail" });
    expect(
      errorsOf({
        ...noContact,
        email: "anna@beispiel.example",
        contactPreference: "email",
      }),
    ).toEqual({});
  });

  it("caps the free texts", () => {
    expect(errorsOf({ ...VALID, name: "a".repeat(101) })).toEqual({
      name: "nameLong",
    });
    expect(errorsOf({ ...VALID, city: "a".repeat(101) })).toEqual({
      city: "cityLong",
    });
    expect(errorsOf({ ...VALID, dimensions: "a".repeat(201) })).toEqual({
      dimensions: "dimensionsLong",
    });
  });
});

describe("validateStep", () => {
  it("checks only the fields of its step", () => {
    expect(validateStep(1, { projectType: "kueche" })).toEqual({
      description: "descriptionShort",
    });
    expect(Object.keys(validateStep(2, {}))).toEqual([...STEP_FIELDS[2]]);
    expect(validateStep(3, VALID)).toEqual({});
  });

  it("puts every field into exactly one step", () => {
    const fields = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]];

    expect(new Set(fields).size).toBe(fields.length);
    expect(fields).toEqual([...REQUEST_FIELDS]);
    expect(stepOf("dimensions")).toBe(1);
    expect(stepOf("budget")).toBe(2);
    expect(stepOf("contactPreference")).toBe(3);
  });

  it("finds the first error in the order of the page", () => {
    expect(firstErrorField({ name: "nameMissing", city: "cityMissing" })).toBe(
      "city",
    );
    expect(firstErrorField({})).toBeNull();
  });
});

describe("requestInput", () => {
  it("takes the request's fields as trimmed strings, without empty ones", () => {
    const formData = new FormData();
    formData.set("projectType", "kueche");
    formData.set("city", "  Wendelfing ");
    formData.set("dimensions", "   ");
    formData.set("website", "spam");
    formData.set("phone", new Blob(["089"]));

    expect(requestInput(formData)).toEqual({
      projectType: "kueche",
      city: "Wendelfing",
    });
  });
});

describe("request texts", () => {
  it("has every error message in German and in English", () => {
    for (const key of REQUEST_ERROR_KEYS) {
      expect(de.RequestForm.errors[key], key).toBeTruthy();
      expect(en.RequestForm.errors[key], key).toBeTruthy();
    }
    expect(Object.keys(de.RequestForm.errors).sort()).toEqual(
      [...REQUEST_ERROR_KEYS].sort(),
    );
  });

  it("has a label for every choice in both languages", () => {
    for (const messages of [de, en]) {
      expect(Object.keys(messages.RequestForm.types)).toEqual([
        ...PROJECT_TYPES,
      ]);
      expect(Object.keys(messages.RequestForm.timeframes)).toEqual([
        ...TIMEFRAMES,
      ]);
      expect(Object.keys(messages.RequestForm.budgets)).toEqual([...BUDGETS]);
      expect(Object.keys(messages.RequestForm.preferences)).toEqual([
        ...CONTACT_PREFERENCES,
      ]);
    }
  });

  it("explains the postal code error as the brief does", () => {
    expect(de.RequestForm.errors.postalCodeInvalid).toBe(
      "Bitte geben Sie eine fünfstellige Postleitzahl ein.",
    );
  });
});

describe("kind of work from a service", () => {
  it("maps the German slugs of the four services", () => {
    expect(projectTypeOfService("kuechen")).toBe("kueche");
    expect(projectTypeOfService("schraenke-und-moebel")).toBe("schrank");
    expect(projectTypeOfService("tueren")).toBe("tueren");
    expect(projectTypeOfService("innenausbau")).toBe("ausbau");
  });

  it("has a kind of work for every service of the seed", () => {
    for (const service of services) {
      expect(
        projectTypeOfService(service.text.de.slug),
        service.text.de.slug,
      ).not.toBeNull();
    }
  });

  it("chooses nothing for an unknown or renamed service", () => {
    expect(projectTypeOfService("treppen")).toBeNull();
  });

  it("knows the values of ?typ=", () => {
    expect(isProjectType("kueche")).toBe(true);
    expect(isProjectType("KUECHE")).toBe(false);
    expect(isProjectType(null)).toBe(false);
  });
});
