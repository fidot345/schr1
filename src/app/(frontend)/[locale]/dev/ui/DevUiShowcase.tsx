import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
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
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  ArrowRightIcon,
  CloseIcon,
  ErrorIcon,
  MenuIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepNumber } from "@/components/ui/StepNumber";
import { TextLink } from "@/components/ui/TextLink";
import { getDemoSite } from "@/content/demo-site";

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

type Pin = "hover" | "focus";

/** normal, hover, focus: the three states every interactive component shows. */
const STATES: readonly (Pin | undefined)[] = [undefined, "hover", "focus"];

/**
 * data-pin pins a state on an element (globals.css), so the page shows hover
 * and focus without a mouse or the keyboard.
 */
const pinned = (pin: Pin | undefined) => (pin ? { "data-pin": pin } : {});

type StatesRowProps = {
  label: string;
  children: (pin: Pin | undefined) => ReactNode;
};

/** One component in its three states, side by side. */
function StatesRow({ label, children }: StatesRowProps) {
  const t = useTranslations("DevUi.states");

  return (
    <div className="border-t border-linie py-6">
      <p className="text-small font-bold">{label}</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {STATES.map((pin) => (
          <div key={pin ?? "normal"}>
            <p className="text-xs text-schiefer">{t(pin ?? "normal")}</p>
            <div className="mt-2">{children(pin)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEP_STATES = ["active", "default", "muted"] as const;
const STEP_SIZES = [32, 44] as const;

/**
 * The overview of the design tokens and the components: the palette, the type
 * scale, the logo, buttons, links, step numbers, icons, the sections and the
 * form, put together as in mockup 03 with its error shown.
 */
export function DevUiShowcase() {
  const t = useTranslations("DevUi");
  const common = useTranslations();
  const { company, openingHours } = getDemoSite(useLocale());

  return (
    <main id="main">
      <Container className="py-16">
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

        <section aria-labelledby="dev-logo" className="mt-16">
          <h2 id="dev-logo">{t("groups.logo")}</h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            <li>
              <p className="text-xs text-schiefer">{t("logo.full")}</p>
              <div className="mt-3 rounded border border-linie p-6">
                <div id="dev-logo-full" className="flex w-fit">
                  <Logo
                    variant="full"
                    name={t("logo.name")}
                    descriptor={t("logo.descriptor")}
                  />
                </div>
              </div>
            </li>
            <li>
              <p className="text-xs text-schiefer">{t("logo.compact")}</p>
              <div className="mt-3 rounded border border-linie p-6">
                <div id="dev-logo-compact" className="flex w-fit">
                  <Logo variant="compact" name={t("logo.name")} />
                </div>
              </div>
            </li>
            <li>
              <p className="text-xs text-schiefer">{t("logo.light")}</p>
              <div className="mt-3 rounded bg-graphit p-6">
                <div id="dev-logo-light" className="flex w-fit">
                  <Logo variant="light" name={t("logo.name")} />
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section aria-labelledby="dev-buttons" className="mt-16">
          <h2 id="dev-buttons">{t("groups.buttons")}</h2>
          <p className="mt-4 max-w-[36em] text-schiefer">{t("statesNote")}</p>
          <div className="mt-8">
            <StatesRow label={t("buttons.primary")}>
              {(pin) => (
                <Button {...pinned(pin)}>{common("Header.cta")}</Button>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.secondary")}>
              {(pin) => (
                <ButtonLink href="#" variant="secondary" {...pinned(pin)}>
                  {common("HomePage.jobsCta")}
                </ButtonLink>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.text")}>
              {(pin) => (
                <Button variant="text" {...pinned(pin)}>
                  {t("buttons.textLabel")}
                </Button>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.header")}>
              {(pin) => (
                <ButtonLink href="#" size="header" {...pinned(pin)}>
                  {common("Header.cta")}
                </ButtonLink>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.menu")}>
              {(pin) => (
                <Button
                  variant="menu"
                  icon={<MenuIcon />}
                  aria-expanded="false"
                  {...pinned(pin)}
                >
                  {common("Header.menuButton")}
                </Button>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.withIcon")}>
              {(pin) => (
                <ButtonLink
                  href="tel:+498999998412"
                  variant="secondary"
                  icon={<PhoneIcon />}
                  {...pinned(pin)}
                >
                  {common("MobileActionBar.call")}
                </ButtonLink>
              )}
            </StatesRow>
            <StatesRow label={t("buttons.fullWidth")}>
              {(pin) => (
                <ButtonLink href="#" fullWidth {...pinned(pin)}>
                  {common("Header.cta")}
                </ButtonLink>
              )}
            </StatesRow>
          </div>
        </section>

        <section aria-labelledby="dev-links" className="mt-16">
          <h2 id="dev-links">{t("groups.links")}</h2>
          <div className="mt-8">
            {(["strong", "plain", "muted"] as const).map((tone) => (
              <StatesRow key={tone} label={t(`links.${tone}`)}>
                {(pin) => (
                  <TextLink href="#" tone={tone} {...pinned(pin)}>
                    {common("HomePage.aboutMore")}
                  </TextLink>
                )}
              </StatesRow>
            ))}
          </div>
        </section>

        <section aria-labelledby="dev-steps" className="mt-16">
          <h2 id="dev-steps">{t("groups.steps")}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {STEP_SIZES.flatMap((size) =>
              STEP_STATES.map((state) => (
                <li
                  key={`${size}-${state}`}
                  className="flex items-center gap-4 border-t border-linie pt-4"
                >
                  <StepNumber value={3} size={size} state={state} />
                  <span className="text-small text-schiefer">
                    {t(`steps.${state}`)}, {t("steps.size", { size })}
                  </span>
                </li>
              )),
            )}
          </ul>
        </section>

        <section aria-labelledby="dev-icons" className="mt-16">
          <h2 id="dev-icons">{t("groups.icons")}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            <li className="flex items-center gap-3">
              <PhoneIcon />
              <span className="text-small">{t("icons.phone")}</span>
            </li>
            <li className="flex items-center gap-3">
              <MenuIcon />
              <span className="text-small">{t("icons.menu")}</span>
            </li>
            <li className="flex items-center gap-3">
              <CloseIcon />
              <span className="text-small">{t("icons.close")}</span>
            </li>
            <li className="flex items-center gap-3">
              <ArrowRightIcon size={22} className="text-tannengruen" />
              <span className="text-small">{t("icons.arrowRight")}</span>
            </li>
            <li className="flex items-center gap-3">
              <ErrorIcon className="text-fehler" />
              <span className="text-small">{t("icons.error")}</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="dev-sections" className="mt-16">
          <h2 id="dev-sections">{t("groups.sections")}</h2>
        </section>
      </Container>

      <Section labelledBy="dev-section-default">
        <Container>
          <p className="text-xs text-schiefer">{t("sections.default")}</p>
          <SectionHeading
            id="dev-section-default"
            className="mt-4"
            title={common("HomePage.servicesTitle")}
            intro={t("sections.intro")}
            link={{ href: "#", label: common("HomePage.allProjects") }}
          />
        </Container>
      </Section>

      <Section variant="moos" labelledBy="dev-section-moos">
        <Container>
          <p className="text-xs text-schiefer">{t("sections.moos")}</p>
          <SectionHeading
            id="dev-section-moos"
            className="mt-4"
            title={common("Process.title")}
          />
        </Container>
      </Section>

      <Section variant="line" labelledBy="dev-section-line">
        <Container>
          <p className="text-xs text-schiefer">{t("sections.line")}</p>
          <SectionHeading
            id="dev-section-line"
            className="mt-4"
            title={common("HomePage.contactTitle")}
          />
        </Container>
      </Section>

      <Container className="py-16">
        <section aria-labelledby="dev-form">
          <h2 id="dev-form">{t("groups.form")}</h2>
          <div
            id="dev-form-sample"
            className="mt-8 flex flex-wrap items-start gap-14"
          >
            <div className="min-w-0 flex-[7_1_560px]">
              <Stepper
                current={1}
                steps={[
                  t("form.steps.what"),
                  t("form.steps.where"),
                  t("form.steps.contact"),
                ]}
              />
              <FormCard className="mt-8" noValidate>
                <ErrorSummary
                  errors={[
                    {
                      fieldId: "beschreibung",
                      message: t("form.description.summary"),
                    },
                  ]}
                />
                <RadioCards
                  className="mt-8"
                  name="typ"
                  legend={t("form.typeLegend")}
                  defaultValue="kueche"
                  options={[
                    { value: "kueche", label: t("form.types.kitchen") },
                    { value: "schrank", label: t("form.types.wardrobe") },
                    { value: "tueren", label: t("form.types.doors") },
                    { value: "ausbau", label: t("form.types.fitout") },
                    { value: "anderes", label: t("form.types.other") },
                  ]}
                />
                <Field
                  id="beschreibung"
                  className="mt-8"
                  label={t("form.description.label")}
                  hint={t("form.description.hint")}
                  error={t("form.description.error")}
                >
                  {(control) => <Textarea name="beschreibung" {...control} />}
                </Field>
                <Field
                  id="masse"
                  className="mt-7"
                  label={t("form.size.label")}
                  optional
                  hint={t("form.size.hint")}
                >
                  {(control) => (
                    <TextInput
                      name="masse"
                      className="max-w-105"
                      {...control}
                    />
                  )}
                </Field>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Button>{t("form.next")}</Button>
                </div>
                <p className="mt-6 text-xs text-schiefer">
                  {t.rich("form.privacy", {
                    link: (chunks) => (
                      <TextLink href="#" tone="plain">
                        {chunks}
                      </TextLink>
                    ),
                  })}
                </p>
              </FormCard>
              <ConceptNote className="mt-4" />
            </div>
            <aside
              aria-labelledby="dev-form-next"
              className="min-w-0 flex-[4_1_300px]"
            >
              <NextSteps
                headingId="dev-form-next"
                steps={[
                  t("form.nextSteps.first"),
                  t("form.nextSteps.second"),
                  t("form.nextSteps.third"),
                ]}
              />
              <CallBox
                className="mt-9"
                phone={company.phone}
                openingHours={openingHours}
              />
            </aside>
          </div>
        </section>
      </Container>
    </main>
  );
}
