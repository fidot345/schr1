import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Heading, type HeadingLevel } from "@/components/ui/Heading";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import {
  DEMO_BRAND_NAME,
  DEMO_COLORS,
  DEMO_COMPANY,
  DEMO_OPENING_HOURS,
  DEMO_VACATION,
} from "./demo-data";

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4];
const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "text"];
const TOPICS = ["kitchen", "wardrobe", "doors", "interior"] as const;

/** Ids of the fields with an error; the error summaries link to them. */
const INVALID = {
  email: "demo-email-invalid",
  message: "demo-message-invalid",
  topic: "demo-topic-invalid",
  consent: "demo-consent-invalid",
};

type GroupProps = {
  id: string;
  title: string;
  note?: string;
  children?: ReactNode;
};

function Group({ id, title, note, children }: GroupProps) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-6 border-t border-linie pt-8"
    >
      <Heading level={2} size={3} id={id}>
        {title}
      </Heading>
      {note ? <p className="max-w-measure text-schiefer">{note}</p> : null}
      {children}
    </section>
  );
}

/** A small Schiefer caption above an example. */
function Caption({ children }: { children: ReactNode }) {
  return <p className="text-small text-schiefer">{children}</p>;
}

/**
 * Every component of the site on one page, BRIEF.md sections 3 and 6.
 * Header, footer and mobile bar stand where they stand on real pages,
 * so sticky, the compact header and the menu behave as they will there.
 */
export function DevUiShowcase() {
  const t = useTranslations("DevUi");

  const topicOptions = TOPICS.map((topic) => ({
    value: topic,
    label: t(`fields.topics.${topic}`),
  }));

  return (
    <>
      <VacationBanner from={DEMO_VACATION.from} to={DEMO_VACATION.to} />
      <Header brandName={DEMO_BRAND_NAME} />

      <main id="main">
        <Container className="flex flex-col gap-section py-section">
          <div className="flex flex-col gap-4">
            <Heading level={1}>{t("title")}</Heading>
            <p className="max-w-measure text-lead">{t("intro")}</p>
          </div>

          <Group id="dev-colors" title={t("groups.colors")}>
            <ul className="grid grid-cols-2 gap-6 md:grid-cols-5">
              {DEMO_COLORS.map((color) => (
                <li key={color.token} className="flex flex-col gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-16 rounded border border-linie",
                      color.swatch,
                    )}
                  />
                  <span className="font-bold">{color.name}</span>
                  <code className="text-small break-all text-schiefer">
                    {color.token}
                  </code>
                </li>
              ))}
            </ul>
          </Group>

          <Group id="dev-typography" title={t("groups.typography")}>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Heading level={3} size={4}>
                  {t("typography.headingFont")}
                </Heading>
                <div>
                  <Caption>{t("typography.semibold")}</Caption>
                  <p className="font-heading text-h3 font-semibold">
                    {t("typography.sample")}
                  </p>
                </div>
                <div>
                  <Caption>{t("typography.bold")}</Caption>
                  <p className="font-heading text-h3 font-bold">
                    {t("typography.sample")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Heading level={3} size={4}>
                  {t("typography.bodyFont")}
                </Heading>
                <div>
                  <Caption>{t("typography.regular")}</Caption>
                  <p>{t("typography.sample")}</p>
                </div>
                <div>
                  <Caption>{t("typography.bold")}</Caption>
                  <p className="font-bold">{t("typography.sample")}</p>
                </div>
                <div>
                  <Caption>{t("typography.lead")}</Caption>
                  <p className="text-lead">{t("typography.sample")}</p>
                </div>
                <div>
                  <Caption>{t("typography.body")}</Caption>
                  <p className="text-body">{t("typography.sample")}</p>
                </div>
                <div>
                  <Caption>{t("typography.small")}</Caption>
                  <p className="text-small">{t("typography.sample")}</p>
                </div>
              </div>
            </div>
          </Group>

          <Group id="dev-headings" title={t("groups.headings")}>
            {/* Level 3 keeps the page outline; size shows each step. */}
            {HEADING_LEVELS.map((level) => (
              <Heading key={level} level={3} size={level}>
                {t("headings.sample", { level: `H${level}` })}
              </Heading>
            ))}
          </Group>

          <Group id="dev-buttons" title={t("groups.buttons")}>
            <div className="flex flex-wrap items-center gap-4">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {t(`buttons.${variant}`)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} disabled>
                  {t("buttons.disabled", { variant: t(`buttons.${variant}`) })}
                </Button>
              ))}
            </div>
          </Group>

          <Group id="dev-text-links" title={t("groups.textLinks")}>
            <p>
              <TextLink href="/kontakt">{t("textLinks.dark")}</TextLink>
            </p>
            <p className="rounded bg-graphit p-6 text-papier">
              <TextLink href="/kontakt" tone="light">
                {t("textLinks.light")}
              </TextLink>
            </p>
          </Group>

          <Group id="dev-fields" title={t("groups.fields")}>
            <div className="grid gap-12 md:grid-cols-2 md:gap-8">
              <div className="flex flex-col gap-6">
                <Heading level={3} size={4}>
                  {t("fields.withoutError")}
                </Heading>
                <TextInput
                  id="demo-name"
                  label={t("fields.name")}
                  hint={t("fields.nameHint")}
                  autoComplete="name"
                />
                <TextArea
                  id="demo-message"
                  label={t("fields.message")}
                  optional
                />
                <Select
                  id="demo-topic"
                  label={t("fields.topic")}
                  placeholder={t("fields.topicPlaceholder")}
                  options={topicOptions}
                />
                <Checkbox id="demo-consent" label={t("fields.consent")} />
              </div>
              <div className="flex flex-col gap-6">
                <Heading level={3} size={4}>
                  {t("fields.withError")}
                </Heading>
                <TextInput
                  id={INVALID.email}
                  type="email"
                  label={t("fields.email")}
                  error={t("fields.emailError")}
                  defaultValue="johannes@tannrieder"
                  autoComplete="email"
                />
                <TextArea
                  id={INVALID.message}
                  label={t("fields.message")}
                  error={t("fields.messageError")}
                />
                <Select
                  id={INVALID.topic}
                  label={t("fields.topic")}
                  placeholder={t("fields.topicPlaceholder")}
                  options={topicOptions}
                  error={t("fields.topicError")}
                />
                <Checkbox
                  id={INVALID.consent}
                  label={t("fields.consent")}
                  error={t("fields.consentError")}
                />
              </div>
            </div>
          </Group>

          <Group id="dev-error-summary" title={t("groups.errorSummary")}>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Caption>{t("errorSummary.formal")}</Caption>
                <ErrorSummary
                  id="error-summary-formal"
                  errors={[
                    { fieldId: INVALID.email, message: t("fields.emailError") },
                    {
                      fieldId: INVALID.message,
                      message: t("fields.messageError"),
                    },
                    { fieldId: INVALID.topic, message: t("fields.topicError") },
                    {
                      fieldId: INVALID.consent,
                      message: t("fields.consentError"),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Caption>{t("errorSummary.informal")}</Caption>
                <ErrorSummary
                  id="error-summary-informal"
                  address="informal"
                  errors={[
                    {
                      fieldId: INVALID.email,
                      message: t("errorSummary.informalEmail"),
                    },
                    {
                      fieldId: INVALID.message,
                      message: t("errorSummary.informalMessage"),
                    },
                  ]}
                />
              </div>
            </div>
          </Group>

          <Group
            id="dev-vacation-banner"
            title={t("groups.vacationBanner")}
            note={t("notes.vacationBanner")}
          >
            <VacationBanner
              from={DEMO_VACATION.from}
              to={DEMO_VACATION.to}
              label={t("vacationBannerLabel")}
            />
          </Group>

          <Group
            id="dev-header"
            title={t("groups.header")}
            note={t("notes.header")}
          />

          <Group
            id="dev-mobile-menu"
            title={t("groups.mobileMenu")}
            note={t("notes.mobileMenu")}
          />

          <Group id="dev-locale-switcher" title={t("groups.localeSwitcher")}>
            <LocaleSwitcher label={t("localeSwitcherLabel")} />
          </Group>

          <Group
            id="dev-footer"
            title={t("groups.footer")}
            note={t("notes.footer")}
          />

          <Group
            id="dev-mobile-action-bar"
            title={t("groups.mobileActionBar")}
            note={t("notes.mobileActionBar")}
          />
        </Container>
      </main>

      <Footer company={DEMO_COMPANY} openingHours={DEMO_OPENING_HOURS} />
      <MobileActionBar phone={DEMO_COMPANY.phone} />
    </>
  );
}
