import { useTranslations } from "next-intl";

type ColorSwatch = {
  name: string;
  hex: string;
  /** The whole class, so Tailwind finds it in the source. */
  swatchClass: string;
};

/** docs/REDESIGN.md "Токены", Цвета. tests/unit/tokens.test.ts keeps the hex in step with globals.css. */
const COLORS: readonly ColorSwatch[] = [
  { name: "Papier", hex: "#F8F9F7", swatchClass: "bg-papier" },
  { name: "Weiß", hex: "#FFFFFF", swatchClass: "bg-weiss" },
  { name: "Graphit", hex: "#24282A", swatchClass: "bg-graphit" },
  { name: "Schiefer", hex: "#5B6266", swatchClass: "bg-schiefer" },
  { name: "Linie", hex: "#D6DBD8", swatchClass: "bg-linie" },
  { name: "Feldrand", hex: "#7C8482", swatchClass: "bg-feldrand" },
  { name: "Tannengrün", hex: "#1F4537", swatchClass: "bg-tannengruen" },
  {
    name: "Tannengrün dunkel",
    hex: "#15332A",
    swatchClass: "bg-tannengruen-dunkel",
  },
  { name: "Moos", hex: "#E4EBE6", swatchClass: "bg-moos" },
  { name: "Fehler", hex: "#B42318", swatchClass: "bg-fehler" },
];

type TextStep = {
  token: string;
  font: string;
  /** Size, line height and weight as in docs/REDESIGN.md. */
  spec: string;
  className: string;
};

const ZILLA = "Zilla Slab";
const ATKINSON = "Atkinson Hyperlegible Next";

/** docs/REDESIGN.md "Токены", Шкала текста: all 12 steps. */
const TEXT_SCALE: readonly TextStep[] = [
  {
    token: "display",
    font: ZILLA,
    spec: "clamp(36px, 4.4vw, 60px) · 1.05 · 700",
    className: "font-display text-display",
  },
  {
    token: "h1",
    font: ZILLA,
    spec: "clamp(36px, 3.6vw, 52px) · 1.08 · 700",
    className: "font-display text-h1",
  },
  {
    token: "h2",
    font: ZILLA,
    spec: "clamp(28px, 2.8vw, 40px) · 1.15 · 600",
    className: "font-display text-h2",
  },
  {
    token: "h3",
    font: ZILLA,
    spec: "26px · 1.2 · 600",
    className: "font-display text-h3",
  },
  {
    token: "h4",
    font: ZILLA,
    spec: "22px · 1.25 · 600",
    className: "font-display text-h4",
  },
  {
    token: "tel-lg",
    font: ZILLA,
    spec: "clamp(34px, 3.4vw, 48px) · 1.1 · 700",
    className: "font-display text-tel-lg",
  },
  {
    token: "tel",
    font: ZILLA,
    spec: "32px · 1.15 · 700",
    className: "font-display text-tel",
  },
  {
    token: "lead",
    font: ATKINSON,
    spec: "20px, phone 18px · 1.6 · 400",
    className: "font-sans text-lead",
  },
  {
    token: "body",
    font: ATKINSON,
    spec: "18px, phone 17px · 1.6 · 400",
    className: "font-sans text-body",
  },
  {
    token: "ui",
    font: ATKINSON,
    spec: "17px · 1.5 · 400 / 700",
    className: "font-sans text-ui",
  },
  {
    token: "small",
    font: ATKINSON,
    spec: "16px · 1.5 · 400 / 700",
    className: "font-sans text-small",
  },
  {
    token: "xs",
    font: ATKINSON,
    spec: "15px · 1.5 · 400 / 700",
    className: "font-sans text-xs",
  },
];

/**
 * The overview of the design tokens: the palette and the type scale.
 * The components come to this page in redesign sessions 2 and 6.
 */
export function DevUiShowcase() {
  const t = useTranslations("DevUi");

  return (
    <main id="main" className="mx-auto max-w-page px-gutter py-16">
      <h1>{t("title")}</h1>

      <section aria-labelledby="dev-colors" className="mt-16">
        <h2 id="dev-colors">{t("groups.colors")}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-5">
          {COLORS.map((color) => (
            <li key={color.name}>
              <div
                className={`h-20 rounded border border-linie ${color.swatchClass}`}
              />
              <p className="mt-3 text-small font-bold">{color.name}</p>
              <p className="text-small text-schiefer">{color.hex}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dev-type-scale" className="mt-16">
        <h2 id="dev-type-scale">{t("groups.typeScale")}</h2>
        <ul className="mt-8">
          {TEXT_SCALE.map((step) => (
            <li key={step.token} className="border-t border-linie py-6">
              <p className="text-xs text-schiefer">
                {step.token} · {step.font} · {step.spec}
              </p>
              <p className={`mt-2 ${step.className}`}>{t("sample")}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
