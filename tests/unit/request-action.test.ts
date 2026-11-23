import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* next-intl's redirect needs a Next.js request; here it throws what it got. */
class Redirected extends Error {
  constructor(readonly target: unknown) {
    super("redirected");
  }
}

vi.mock("@/i18n/navigation", () => ({
  redirect: (target: unknown) => {
    throw new Redirected(target);
  },
}));

vi.mock("@/lib/mail", () => ({ sendMail: vi.fn() }));

const { sendMail } = await import("@/lib/mail");
const { submitRequest } = await import("@/lib/request-action");

const VALID = {
  projectType: "tueren",
  description: "Fünf Innentüren für einen Altbau, weiß lackiert.",
  postalCode: "85999",
  city: "Wendelfing",
  timeframe: "asap",
  budget: "unknown",
  name: "Anna Beispiel",
  email: "anna@beispiel.example",
  contactPreference: "email",
};

const IDLE = { status: "idle" } as const;

const form = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
};

/** Runs the action; a redirect comes back as its target. */
const submit = async (locale: string, fields: Record<string, string>) => {
  try {
    return { state: await submitRequest(locale, IDLE, form(fields)) };
  } catch (error) {
    if (error instanceof Redirected) {
      return { redirect: error.target };
    }
    throw error;
  }
};

const THANKS_DE = { redirect: { href: "/anfrage/danke", locale: "de" } };

beforeEach(() => {
  vi.mocked(sendMail).mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitRequest", () => {
  it("sends the mail and goes to the thank-you page", async () => {
    expect(await submit("de", { ...VALID, fillTime: "45000" })).toEqual(
      THANKS_DE,
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0][0]).toMatchObject({
      subject: "Neue Anfrage: Innentüren – 85999 Wendelfing",
      replyTo: "anna@beispiel.example",
    });
  });

  it("goes to the English thank-you page from /en/request", async () => {
    expect(await submit("en", { ...VALID, fillTime: "45000" })).toEqual({
      redirect: { href: "/anfrage/danke", locale: "en" },
    });
  });

  it("takes German for a language it does not know", async () => {
    expect(await submit("fr", { ...VALID, fillTime: "45000" })).toEqual(
      THANKS_DE,
    );
  });

  it("sends nothing when the trap is filled, and still thanks", async () => {
    expect(
      await submit("de", { ...VALID, fillTime: "45000", website: "x" }),
    ).toEqual(THANKS_DE);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends nothing when the form took under 3 seconds", async () => {
    expect(await submit("de", { ...VALID, fillTime: "2999" })).toEqual(
      THANKS_DE,
    );
    expect(sendMail).not.toHaveBeenCalled();

    expect(await submit("de", { ...VALID, fillTime: "3000" })).toEqual(
      THANKS_DE,
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("gives the phone number without a fill time (no JavaScript)", async () => {
    for (const fillTime of [undefined, "", "abc"]) {
      const fields: Record<string, string> =
        fillTime === undefined ? VALID : { ...VALID, fillTime };
      expect(await submit("de", fields)).toEqual({
        state: { status: "failed" },
      });
    }
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns the errors and sends nothing when a field is wrong", async () => {
    expect(
      await submit("de", {
        ...VALID,
        postalCode: "123",
        phone: "089 99998 412",
        email: "",
        fillTime: "45000",
      }),
    ).toEqual({
      state: {
        status: "invalid",
        errors: { postalCode: "postalCodeInvalid", email: "emailForMail" },
      },
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("logs a failed mail and gives the phone number", async () => {
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("Resend is down"));

    expect(await submit("de", { ...VALID, fillTime: "45000" })).toEqual({
      state: { status: "failed" },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[request] The mail could not be sent:",
      expect.objectContaining({ message: "Resend is down" }),
    );
  });
});
