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

/* The open jobs, as Payload gives them in German. */
vi.mock("@/lib/content", () => ({ getOpenJobs: vi.fn() }));

const { sendMail } = await import("@/lib/mail");
const { getOpenJobs } = await import("@/lib/content");
const { submitApplication } = await import("@/lib/application-action");

const OPEN_JOBS = [
  { id: 1, title: "Schreiner (m/w/d)" },
  { id: 2, title: "Monteur für Möbel und Küchen (m/w/d)" },
];

const VALID = {
  job: "1",
  name: "Lukas Beispiel",
  phone: "0171 2345678",
  experience: "experienced",
  start: "ab sofort",
  callTime: "morning",
  fillTime: "30000",
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
    return { state: await submitApplication(locale, IDLE, form(fields)) };
  } catch (error) {
    if (error instanceof Redirected) {
      return { redirect: error.target };
    }
    throw error;
  }
};

const THANKS_DE = { redirect: { href: "/karriere/danke", locale: "de" } };

beforeEach(() => {
  vi.mocked(sendMail).mockReset();
  vi.mocked(getOpenJobs).mockReset();
  vi.mocked(getOpenJobs).mockResolvedValue(
    OPEN_JOBS as Awaited<ReturnType<typeof getOpenJobs>>,
  );
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitApplication", () => {
  it("sends the mail with the German job title and goes to the thank-you page", async () => {
    expect(await submit("de", VALID)).toEqual(THANKS_DE);
    expect(getOpenJobs).toHaveBeenCalledWith("de");
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0][0]).toMatchObject({
      subject: "Neue Bewerbung: Schreiner (m/w/d) – Lukas Beispiel",
    });
  });

  it("goes to the English thank-you page from /en/careers, mail in German", async () => {
    expect(await submit("en", { ...VALID, job: "2" })).toEqual({
      redirect: { href: "/karriere/danke", locale: "en" },
    });
    expect(getOpenJobs).toHaveBeenCalledWith("de");
    expect(vi.mocked(sendMail).mock.calls[0][0].subject).toBe(
      "Neue Bewerbung: Monteur für Möbel und Küchen (m/w/d) – Lukas Beispiel",
    );
  });

  it("takes the trial day without asking Payload", async () => {
    expect(
      await submit("de", {
        ...VALID,
        job: "schnuppertag",
        experience: "pupil",
      }),
    ).toEqual(THANKS_DE);
    expect(getOpenJobs).not.toHaveBeenCalled();
    expect(vi.mocked(sendMail).mock.calls[0][0].subject).toBe(
      "Neue Bewerbung: Schnuppertag / Praktikum – Lukas Beispiel",
    );
  });

  it("takes German for a language it does not know", async () => {
    expect(await submit("fr", VALID)).toEqual(THANKS_DE);
  });

  it("sends nothing when the trap is filled, and still thanks", async () => {
    expect(await submit("de", { ...VALID, website: "x" })).toEqual(THANKS_DE);
    expect(sendMail).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "[application] The trap field was filled in; nothing sent.",
    );
  });

  it("sends nothing when the form took under 3 seconds", async () => {
    expect(await submit("de", { ...VALID, fillTime: "2999" })).toEqual(
      THANKS_DE,
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("gives the phone number without a fill time (no JavaScript)", async () => {
    const { fillTime: _fillTime, ...withoutTime } = VALID;

    expect(await submit("de", withoutTime)).toEqual({
      state: { status: "failed" },
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns the errors and sends nothing when a field is wrong", async () => {
    expect(
      await submit("de", { ...VALID, phone: "", message: "a".repeat(501) }),
    ).toEqual({
      state: {
        status: "invalid",
        errors: { phone: "phoneMissing", message: "messageLong" },
      },
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("says so when the job is no longer open", async () => {
    expect(await submit("de", { ...VALID, job: "99" })).toEqual({
      state: { status: "invalid", errors: { job: "jobClosed" } },
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("logs when the jobs cannot be read and gives the phone number", async () => {
    vi.mocked(getOpenJobs).mockRejectedValueOnce(new Error("Neon is down"));

    expect(await submit("de", VALID)).toEqual({
      state: { status: "failed" },
    });
    expect(sendMail).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "[application] The open jobs could not be read:",
      expect.objectContaining({ message: "Neon is down" }),
    );
  });

  it("logs a failed mail and gives the phone number", async () => {
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("Resend is down"));

    expect(await submit("de", VALID)).toEqual({
      state: { status: "failed" },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[application] The mail could not be sent:",
      expect.objectContaining({ message: "Resend is down" }),
    );
  });
});
