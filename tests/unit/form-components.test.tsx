import { describe, expect, it } from "vitest";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { classesOf, render, tagWithId } from "./support/render";

describe("TextInput", () => {
  it("links the label to the input by id", () => {
    const html = render(<TextInput id="name" name="name" label="Name" />);
    expect(html).toMatch(/<label for="name"[^>]*>Name<\/label>/);
    expect(tagWithId(html, "name")).toMatch(/^<input [^>]*type="text"/);
  });

  it("is 52px high on Weiß with a Feldrand border and the 4px radius", () => {
    const input = tagWithId(render(<TextInput id="a" label="A" />), "a");
    expect(classesOf(input)).toEqual(
      expect.arrayContaining([
        "h-13",
        "bg-weiss",
        "border",
        "border-feldrand",
        "rounded",
      ]),
    );
  });

  it("has no aria-invalid or aria-describedby without hint and error", () => {
    const input = tagWithId(render(<TextInput id="a" label="A" />), "a");
    expect(input).not.toMatch(/aria-invalid/);
    expect(input).not.toMatch(/aria-describedby/);
  });

  it("describes the input by its hint", () => {
    const html = render(<TextInput id="plz" label="PLZ" hint="5 Ziffern" />);
    expect(tagWithId(html, "plz")).toMatch(/aria-describedby="plz-hint"/);
    expect(tagWithId(html, "plz-hint")).toMatch(/^<p /);
    expect(html).not.toMatch(/aria-invalid/);
  });

  it("shows an error under the field with icon, red border and aria", () => {
    const html = render(
      <TextInput
        id="plz"
        label="PLZ"
        hint="5 Ziffern"
        error="Bitte 5 Ziffern"
      />,
    );
    const input = tagWithId(html, "plz");
    expect(input).toMatch(/aria-invalid="true"/);
    expect(input).toMatch(/aria-describedby="plz-error plz-hint"/);
    expect(classesOf(input)).toEqual(
      expect.arrayContaining(["border-2", "border-fehler"]),
    );
    expect(classesOf(input)).not.toContain("border-feldrand");

    // The error comes after the input and carries an icon and a text prefix.
    expect(html.indexOf('id="plz-error"')).toBeGreaterThan(
      html.indexOf('id="plz"'),
    );
    const error = html.slice(html.indexOf('id="plz-error"'));
    expect(error).toMatch(/<svg aria-hidden="true"/);
    expect(error).toMatch(
      /<span class="sr-only">Fehler: <\/span>Bitte 5 Ziffern/,
    );
    expect(classesOf(tagWithId(html, "plz-error"))).toContain("text-fehler");
  });

  it("marks optional fields in the label, in both languages", () => {
    expect(render(<TextInput id="a" label="Maße" optional />)).toMatch(
      /Maße<span [^>]*> \(optional\)<\/span><\/label>/,
    );
    expect(render(<TextInput id="a" label="Size" optional />, "en")).toMatch(
      /\(optional\)/,
    );
  });

  it("passes native attributes and the input type through", () => {
    const input = tagWithId(
      render(
        <TextInput
          id="mail"
          label="E-Mail"
          type="email"
          name="email"
          autoComplete="email"
          required
        />,
      ),
      "mail",
    );
    expect(input).toMatch(/type="email"/);
    expect(input).toMatch(/name="email"/);
    expect(input).toMatch(/autoComplete="email"|autocomplete="email"/);
    expect(input).toMatch(/required=""/);
  });
});

describe("TextArea", () => {
  it("is a <textarea> with the same label, border and error wiring", () => {
    const html = render(
      <TextArea id="text" label="Beschreibung" error="Zu kurz" />,
    );
    expect(html).toMatch(/<label for="text"/);
    const textarea = tagWithId(html, "text");
    expect(textarea).toMatch(/^<textarea /);
    expect(textarea).toMatch(/aria-invalid="true"/);
    expect(textarea).toMatch(/aria-describedby="text-error"/);
    expect(classesOf(textarea)).toEqual(
      expect.arrayContaining(["bg-weiss", "border-fehler", "min-h-32"]),
    );
  });
});

describe("Select", () => {
  const options = [
    { value: "kueche", label: "Küche" },
    { value: "tueren", label: "Innentüren" },
  ];

  it("renders a 52px <select> with an empty placeholder option", () => {
    const html = render(
      <Select
        id="typ"
        label="Art"
        options={options}
        placeholder="Bitte wählen"
      />,
    );
    expect(html).toMatch(/<label for="typ"/);
    const select = tagWithId(html, "typ");
    expect(select).toMatch(/^<select /);
    expect(classesOf(select)).toEqual(
      expect.arrayContaining(["h-13", "bg-weiss", "border-feldrand"]),
    );
    expect(html).toMatch(/<option value="">Bitte wählen<\/option>/);
    expect(html).toMatch(/<option value="kueche">Küche<\/option>/);
    expect(html).toMatch(/<option value="tueren">Innentüren<\/option>/);
  });

  it("wires errors like the text field", () => {
    const html = render(
      <Select id="typ" label="Art" options={options} error="Bitte wählen" />,
    );
    expect(tagWithId(html, "typ")).toMatch(/aria-invalid="true"/);
    expect(tagWithId(html, "typ")).toMatch(/aria-describedby="typ-error"/);
    expect(html).toMatch(/id="typ-error"/);
  });
});

describe("Checkbox", () => {
  it("is a checkbox with its label and no aria without an error", () => {
    const html = render(
      <Checkbox id="rueckruf" name="rueckruf" label="Rückruf" />,
    );
    const input = tagWithId(html, "rueckruf");
    expect(input).toMatch(/^<input [^>]*type="checkbox"/);
    expect(input).not.toMatch(/aria-invalid/);
    expect(html).toMatch(/<label for="rueckruf"[^>]*>Rückruf<\/label>/);
  });

  it("turns its border Fehler and points to the error", () => {
    const html = render(
      <Checkbox id="ok" label="OK" error="Bitte bestätigen" />,
    );
    const input = tagWithId(html, "ok");
    expect(input).toMatch(/aria-invalid="true"/);
    expect(input).toMatch(/aria-describedby="ok-error"/);
    expect(classesOf(input)).toContain("border-fehler");
    expect(html).toMatch(/id="ok-error"/);
  });
});

describe("ErrorSummary", () => {
  const errors = [
    { fieldId: "plz", message: "Bitte geben Sie eine PLZ mit 5 Ziffern ein." },
    { fieldId: "name", message: "Bitte geben Sie Ihren Namen ein." },
  ];

  it("renders nothing without errors", () => {
    expect(render(<ErrorSummary errors={[]} />)).toBe("");
  });

  it("is an alert with a title and links to the fields", () => {
    const html = render(<ErrorSummary errors={errors} />);
    const box = tagWithId(html, "error-summary");
    expect(box).toMatch(/role="alert"/);
    expect(box).toMatch(/tabindex="-1"/i);
    expect(box).toMatch(/aria-labelledby="error-summary-title"/);
    expect(tagWithId(html, "error-summary-title")).toMatch(/^<h2 /);
    expect(html).toContain("Bitte prüfen Sie Ihre Angaben");
    expect(html).toMatch(
      /<a href="#plz"[^>]*>Bitte geben Sie eine PLZ mit 5 Ziffern ein.<\/a>/,
    );
    expect(html).toMatch(/<a href="#name"/);
    expect(html.indexOf("#plz")).toBeLessThan(html.indexOf("#name"));
  });

  it("speaks du on career forms and English on /en", () => {
    expect(
      render(<ErrorSummary errors={errors} address="informal" />),
    ).toContain("Bitte prüf deine Angaben");
    expect(render(<ErrorSummary errors={errors} />, "en")).toContain(
      "Please check your details",
    );
  });

  it("takes its id from props so a form can focus it", () => {
    const html = render(<ErrorSummary id="anfrage-errors" errors={errors} />);
    expect(html).toMatch(/id="anfrage-errors"/);
    expect(html).toMatch(/aria-labelledby="anfrage-errors-title"/);
  });
});
