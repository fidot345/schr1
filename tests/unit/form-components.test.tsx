import { describe, expect, it, vi } from "vitest";
import { CallBox } from "@/components/form/CallBox";
import { ConceptNote } from "@/components/form/ConceptNote";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { Field } from "@/components/form/Field";
import { FormCard } from "@/components/form/FormCard";
import { NextSteps } from "@/components/form/NextSteps";
import { RadioCards } from "@/components/form/RadioCards";
import { Stepper } from "@/components/form/Stepper";
import { Textarea } from "@/components/form/Textarea";
import { TextInput } from "@/components/form/TextInput";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import { classesOf, render, tagWithId } from "./support/render";

/* CallBox links with tel:, which is a plain <a>; the mock only keeps
   next-intl's navigation out of Node. */
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

const STEPS = ["Was planen Sie?", "Wo und wann?", "Wie erreichen wir Sie?"];

describe("Stepper", () => {
  it("names the list and marks only the current step", () => {
    const html = render(<Stepper steps={STEPS} current={2} />);

    expect(html).toContain(`aria-label="${de.Form.stepper.label}"`);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain("Schritt 1 von 3");
    expect(html).toContain("Schritt 2 von 3");
    expect(html).toContain("Schritt 3 von 3");
  });

  it("draws the current step in Tannengrün and the others in Linie", () => {
    const html = render(<Stepper steps={STEPS} current={1} />);
    const items = html.split("<li").slice(1);

    expect(items).toHaveLength(3);
    expect(classesOf(items[0])).toEqual(
      expect.arrayContaining(["border-t-4", "border-tannengruen"]),
    );
    for (const other of items.slice(1)) {
      expect(classesOf(other)).toEqual(
        expect.arrayContaining(["border-t-4", "border-linie", "text-schiefer"]),
      );
      expect(classesOf(other)).not.toContain("border-tannengruen");
    }
    expect(html.split("font-bold")).toHaveLength(3);
  });

  it("speaks English on /en", () => {
    const html = render(<Stepper steps={STEPS} current={1} />, "en");

    expect(html).toContain("Step 1 of 3");
    expect(html).toContain(`aria-label="${en.Form.stepper.label}"`);
  });
});

describe("FormCard", () => {
  it("is a white form with a Linie frame that passes its props on", () => {
    const html = render(
      <FormCard noValidate id="anfrage">
        x
      </FormCard>,
    );

    expect(html).toMatch(/^<form /);
    expect(html).toContain('noValidate=""');
    expect(html).toContain('id="anfrage"');
    expect(classesOf(html)).toEqual(
      expect.arrayContaining([
        "rounded",
        "border",
        "border-linie",
        "bg-weiss",
        "p-[clamp(1.5rem,3vw,2.5rem)]",
      ]),
    );
  });
});

describe("ErrorSummary", () => {
  const errors = [
    { fieldId: "beschreibung", message: "Beschreiben Sie Ihr Vorhaben." },
    { fieldId: "plz", message: "Geben Sie fünf Ziffern ein." },
  ];

  it("is an alert with a title and one link per error to its field", () => {
    const html = render(<ErrorSummary errors={errors} />);

    expect(html).toContain('role="alert"');
    expect(html).toContain(`>${de.Form.errorSummary.titleFormal}</h2>`);
    expect(html).toContain('href="#beschreibung"');
    expect(html).toContain('href="#plz"');
    expect(html).toContain(">Geben Sie fünf Ziffern ein.</a>");
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["border-2", "border-fehler", "bg-weiss"]),
    );
  });

  it("is not there without errors", () => {
    expect(render(<ErrorSummary errors={[]} />)).toBe("");
  });

  it("speaks English on /en", () => {
    expect(render(<ErrorSummary errors={errors} />, "en")).toContain(
      `>${en.Form.errorSummary.titleFormal}</h2>`,
    );
  });
});

describe("Field", () => {
  it("ties label, hint and error to the control", () => {
    const html = render(
      <Field
        id="beschreibung"
        label="Vorhaben"
        hint="Ein Beispiel"
        error="Zu kurz"
      >
        {(control) => <Textarea name="beschreibung" {...control} />}
      </Field>,
    );

    expect(html).toContain('<label for="beschreibung"');
    expect(html).toContain('id="beschreibung-hint"');
    expect(html).toContain('id="beschreibung-error"');

    const control = tagWithId(html, "beschreibung");
    expect(control).toContain('aria-invalid="true"');
    expect(control).toContain(
      'aria-describedby="beschreibung-hint beschreibung-error"',
    );
  });

  it("shows the error with an icon and a prefix that only a screen reader hears", () => {
    const html = render(
      <Field id="plz" label="PLZ" error="Fünf Ziffern">
        {(control) => <TextInput {...control} />}
      </Field>,
    );

    expect(html).toContain("<svg");
    expect(html).toContain(
      `<span class="sr-only">${de.Form.errorPrefix} </span>`,
    );
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["text-fehler", "font-bold"]),
    );
  });

  it("has no error markup and is not invalid without an error", () => {
    const html = render(
      <Field id="masse" label="Maße" hint="Breite × Höhe">
        {(control) => <TextInput {...control} />}
      </Field>,
    );
    const control = tagWithId(html, "masse");

    // The class names contain "aria-invalid:", the attribute is `aria-invalid="`.
    expect(control).not.toContain('aria-invalid="');
    expect(control).toContain('aria-describedby="masse-hint"');
    expect(html).not.toContain("masse-error");
    expect(html).not.toContain("<svg");
  });

  it("leaves aria-describedby out when there is neither hint nor error", () => {
    const html = render(
      <Field id="name" label="Name">
        {(control) => <TextInput {...control} />}
      </Field>,
    );

    expect(tagWithId(html, "name")).not.toContain("aria-describedby");
  });

  it.each([
    ["de", de],
    ["en", en],
  ] as const)("marks an optional field in %s", (locale, messages) => {
    const html = render(
      <Field id="masse" label="Maße" optional>
        {(control) => <TextInput {...control} />}
      </Field>,
      locale,
    );

    expect(html).toContain(`>${messages.Form.optional}</span>`);
    expect(
      render(
        <Field id="masse" label="Maße">
          {(control) => <TextInput {...control} />}
        </Field>,
        locale,
      ),
    ).not.toContain(messages.Form.optional);
  });
});

describe("TextInput and Textarea", () => {
  it("are Weiß fields with a 1px Feldrand frame that turns Fehler when invalid", () => {
    for (const html of [render(<TextInput />), render(<Textarea />)]) {
      expect(classesOf(html)).toEqual(
        expect.arrayContaining([
          "w-full",
          "rounded",
          "border",
          "border-feldrand",
          "bg-weiss",
          "text-ui",
          "aria-invalid:border-2",
          "aria-invalid:border-fehler",
        ]),
      );
    }
  });

  it("make a 52px text field and a five-row area that can be pulled taller", () => {
    const input = render(<TextInput name="masse" className="max-w-105" />);
    expect(input).toContain('type="text"');
    expect(classesOf(input)).toEqual(
      expect.arrayContaining(["h-13", "px-4", "max-w-105"]),
    );

    const area = render(<Textarea name="beschreibung" />);
    expect(area).toContain('rows="5"');
    expect(classesOf(area)).toEqual(
      expect.arrayContaining(["resize-y", "px-4", "py-3.5"]),
    );
  });
});

describe("RadioCards", () => {
  const options = [
    { value: "kueche", label: "Küche" },
    { value: "schrank", label: "Schrank" },
    { value: "tueren", label: "Innentüren" },
  ];

  it("is a fieldset named by its legend with one real radio per option", () => {
    const html = render(
      <RadioCards
        name="typ"
        legend="Was möchten Sie bauen lassen?"
        options={options}
      />,
    );

    expect(html).toMatch(/^<fieldset /);
    expect(html).toContain(">Was möchten Sie bauen lassen?</legend>");
    expect(html.match(/<input type="radio"/g)).toHaveLength(3);
    expect(html.match(/name="typ"/g)).toHaveLength(3);
    expect(html).toContain('value="schrank"');
    expect(html).toContain(">Innentüren</span>");
  });

  it("chooses the default value and only that one", () => {
    const html = render(
      <RadioCards
        name="typ"
        legend="Typ"
        options={options}
        defaultValue="schrank"
      />,
    );

    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toMatch(
      /value="schrank"[^>]*checked=""|checked=""[^>]*value="schrank"/,
    );
  });

  it("gives the chosen card a 2px Tannengrün frame on Moos, one pixel less padding", () => {
    const html = render(
      <RadioCards name="typ" legend="Typ" options={options} />,
    );

    expect(classesOf(html)).toEqual(
      expect.arrayContaining([
        "min-h-15",
        "border-feldrand",
        "px-4.5",
        "has-checked:border-2",
        "has-checked:border-tannengruen",
        "has-checked:bg-moos",
        "has-checked:px-4.25",
        "has-checked:font-bold",
        "accent-tannengruen",
        "size-5",
      ]),
    );
    expect(html).toContain("grid-cols-[repeat(auto-fill,minmax(200px,1fr))]");
  });

  it("gives the first radio the id and ties an error to the group", () => {
    const html = render(
      <RadioCards
        id="typ"
        name="typ"
        legend="Typ"
        options={options}
        error="Bitte wählen Sie aus, was wir für Sie bauen sollen."
      />,
    );

    expect(html.match(/ id="typ"/g)).toHaveLength(1);
    expect(html).toMatch(/<input id="typ" type="radio"[^>]*value="kueche"/);
    expect(html).toMatch(/^<fieldset aria-describedby="typ-error"/);
    expect(tagWithId(html, "typ-error")).toMatch(/^<p /);
    expect(html).toContain(
      `${de.Form.errorPrefix} </span>Bitte wählen Sie aus, was wir für Sie bauen sollen.`,
    );
  });

  it("has no error markup without an error", () => {
    const html = render(
      <RadioCards id="typ" name="typ" legend="Typ" options={options} />,
    );

    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("typ-error");
  });
});

describe("NextSteps", () => {
  const steps = ["Wir melden uns.", "Wir kommen vorbei."];

  it("is a heading and a numbered list of round numbers", () => {
    const html = render(<NextSteps headingId="danach-titel" steps={steps} />);

    expect(html).toContain(
      `<h2 id="danach-titel" class="font-display text-h3">${de.Form.nextSteps.title}</h2>`,
    );
    expect(html).toContain("<ol");
    expect(html.split("rounded-full")).toHaveLength(3);
    expect(html).toContain(">Wir kommen vorbei.</span>");
  });

  it("speaks English on /en", () => {
    expect(render(<NextSteps headingId="x" steps={steps} />, "en")).toContain(
      `>${en.Form.nextSteps.title}</h2>`,
    );
  });
});

describe("CallBox", () => {
  const openingHours = [
    { id: "weekdays", days: "Mo–Do", hours: "7:00–16:30" },
    { id: "friday", days: "Fr", hours: "7:00–12:00" },
  ];

  it("shows the phone number as a tel: link and the hours in one line", () => {
    const html = render(
      <CallBox phone="089 99998 412" openingHours={openingHours} />,
    );

    expect(html).toContain(`>${de.Form.callBox.title}</h3>`);
    expect(html).toContain('href="tel:+498999998412"');
    expect(html).toContain(">089 99998 412</a>");
    expect(html).toContain("Mo–Do 7:00–16:30 Uhr, Fr 7:00–12:00 Uhr");
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["bg-moos", "rounded", "p-6", "text-tel"]),
    );
  });

  it("writes the hours without “Uhr” in English", () => {
    const html = render(
      <CallBox phone="089 99998 412" openingHours={openingHours} />,
      "en",
    );

    expect(html).toContain(`>${en.Form.callBox.title}</h3>`);
    expect(html).toContain("Mo–Do 7:00–16:30, Fr 7:00–12:00");
    expect(html).not.toContain("Uhr");
  });
});

describe("ConceptNote", () => {
  it.each([
    ["de", de],
    ["en", en],
  ] as const)("says the firm is fictitious in %s", (locale, messages) => {
    const html = render(<ConceptNote className="mt-4" />, locale);

    expect(html).toContain(`>${messages.Demo.notice}</p>`);
    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["text-xs", "text-schiefer", "mt-4"]),
    );
  });
});
