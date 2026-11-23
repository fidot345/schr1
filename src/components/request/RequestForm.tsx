"use client";

/*
 * Client component: the steps, the hints while typing, the focus on the
 * first error and useActionState for the server's answer all need the
 * browser.
 */

import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { ErrorSummary, type FormError } from "@/components/form/ErrorSummary";
import { Field } from "@/components/form/Field";
import { FormCard } from "@/components/form/FormCard";
import { RadioCards } from "@/components/form/RadioCards";
import { Stepper } from "@/components/form/Stepper";
import { Textarea } from "@/components/form/Textarea";
import { TextInput } from "@/components/form/TextInput";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { telHref } from "@/lib/phone";
import { submitRequest } from "@/lib/request-action";
import {
  BUDGETS,
  CONTACT_PREFERENCES,
  FILL_TIME_FIELD,
  firstErrorField,
  isProjectType,
  PROJECT_TYPES,
  type ProjectType,
  type RequestErrors,
  type RequestField,
  type RequestState,
  type RequestStep,
  requestInput,
  STEP_FIELDS,
  stepOf,
  TIMEFRAMES,
  TRAP_FIELD,
  validateStep,
} from "@/lib/request-schema";

const INITIAL_STATE: RequestState = { status: "idle" };
const STEPS: readonly RequestStep[] = [1, 2, 3];
const LAST_STEP: RequestStep = 3;

const fieldId = (field: RequestField) => `request-${field}`;
const stepHeadingId = (step: RequestStep) => `request-step-${step}`;
const FAILED_ID = "request-failed";

const isField = (name: string, step: RequestStep): name is RequestField =>
  (STEP_FIELDS[step] as readonly string[]).includes(name);

/** The steps whose errors are shown: checked once, they follow the typing. */
type CheckedSteps = Partial<Record<RequestStep, true>>;

type RequestFormProps = {
  /** As people write it, from SiteSettings: for the message when sending fails. */
  phone: string | null;
};

/**
 * The request in three steps, BRIEF.md section 5 "Formen", mockup 03.
 *
 * All steps stay in the form, the ones not shown are hidden, so the values
 * survive "Zurück" and are sent together. "Weiter" (and Enter in a field)
 * checks the step with the same schema as the server: the errors appear
 * under the fields and in a list on top, and the focus moves to the first
 * one. From then on the errors of that step follow the typing and go away
 * as soon as a field is right. Errors never appear when a field is left:
 * the text pushing the button down would make the click on "Weiter" miss.
 * ?typ=kueche chooses the kind of work.
 */
export function RequestForm({ phone }: RequestFormProps) {
  const t = useTranslations("RequestForm");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    submitRequest.bind(null, locale),
    INITIAL_STATE,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const openedAt = useRef(0);
  const [step, setStep] = useState<RequestStep>(1);
  const [errors, setErrors] = useState<RequestErrors>({});
  const [checked, setChecked] = useState<CheckedSteps>({});
  const [showSummary, setShowSummary] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [chosenType, setChosenType] = useState<ProjectType | null>(null);

  useEffect(() => {
    openedAt.current = performance.now();
    // Read here, not with useSearchParams: the page stays static.
    const type = new URLSearchParams(window.location.search).get("typ");
    if (isProjectType(type)) {
      setChosenType(type);
    }
  }, []);

  // Focus after the render that shows the target, then forget it.
  useEffect(() => {
    if (focusTarget) {
      document.getElementById(focusTarget)?.focus();
      setFocusTarget(null);
    }
  }, [focusTarget]);

  // The server's answer: its errors as if the browser had found them.
  useEffect(() => {
    if (state.status === "invalid") {
      const first = firstErrorField(state.errors);
      setErrors(state.errors);
      setChecked({ 1: true, 2: true, 3: true });
      if (first) {
        setStep(stepOf(first));
        setShowSummary(true);
        setFocusTarget(fieldId(first));
      }
    } else if (state.status === "failed") {
      setFocusTarget(FAILED_ID);
    }
  }, [state]);

  /** This step's errors in the form as it is now, shown in place of the old ones. */
  const updateErrors = (): RequestErrors => {
    const found = validateStep(
      step,
      requestInput(new FormData(formRef.current ?? undefined)),
    );
    setErrors((previous) => {
      const next = { ...previous };
      for (const field of STEP_FIELDS[step]) {
        next[field] = found[field];
      }
      return next;
    });
    return found;
  };

  /** Checks the whole step, as "Weiter" does. True when it is fine. */
  const checkStep = (): boolean => {
    const found = updateErrors();
    setChecked((previous) => ({ ...previous, [step]: true }));

    const first = STEP_FIELDS[step].find((field) => found[field]);
    if (first) {
      setShowSummary(true);
      setFocusTarget(fieldId(first));
      return false;
    }
    return true;
  };

  const goTo = (next: RequestStep) => {
    setStep(next);
    setShowSummary(false);
    setFocusTarget(stepHeadingId(next));
  };

  const onChange = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      checked[step] &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement) &&
      isField(target.name, step)
    ) {
      updateErrors();
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Every step, also the last, goes through here: the action is started
    // by hand, so React does not empty the fields after an error.
    event.preventDefault();
    if (pending || !checkStep()) {
      return;
    }
    if (step < LAST_STEP) {
      goTo((step + 1) as RequestStep);
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set(
      FILL_TIME_FIELD,
      String(Math.round(performance.now() - openedAt.current)),
    );
    startTransition(() => formAction(formData));
  };

  const summary: FormError[] = showSummary
    ? STEP_FIELDS[step].flatMap((field) => {
        const key = errors[field];
        return key
          ? [{ fieldId: fieldId(field), message: t(`errors.${key}`) }]
          : [];
      })
    : [];

  const error = (field: RequestField) => {
    const key = errors[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  const tel = telHref(phone);
  const stepTitles = [t("steps.what"), t("steps.where"), t("steps.contact")];

  const stepHeading = (current: RequestStep) => (
    <h2 id={stepHeadingId(current)} tabIndex={-1} className="sr-only">
      {t("stepHeading", {
        current,
        total: STEPS.length,
        title: stepTitles[current - 1],
      })}
    </h2>
  );

  return (
    <>
      <Stepper steps={stepTitles} current={step} />
      <FormCard
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-8"
        onSubmit={onSubmit}
        onChange={onChange}
      >
        {state.status === "failed" ? (
          <p
            id={FAILED_ID}
            role="alert"
            tabIndex={-1}
            className="mb-8 rounded border-2 border-fehler bg-weiss px-6 py-5 font-bold"
          >
            {tel && phone
              ? t.rich("failed", {
                  phone,
                  link: (chunks) => <TextLink href={tel}>{chunks}</TextLink>,
                })
              : t("failedNoPhone")}
          </p>
        ) : null}
        <ErrorSummary
          errors={summary}
          className="mb-8"
          onLinkClick={(id) => document.getElementById(id)?.focus()}
        />

        <div hidden={step !== 1}>
          {stepHeading(1)}
          <RadioCards
            // Chosen from ?typ= after the first render: a new group then.
            key={chosenType ?? "none"}
            id={fieldId("projectType")}
            name="projectType"
            legend={t("typeLegend")}
            defaultValue={chosenType ?? undefined}
            error={error("projectType")}
            options={PROJECT_TYPES.map((value) => ({
              value,
              label: t(`types.${value}`),
            }))}
          />
          <Field
            id={fieldId("description")}
            className="mt-8"
            label={t("description.label")}
            hint={t("description.hint")}
            error={error("description")}
          >
            {(control) => <Textarea name="description" {...control} />}
          </Field>
          <Field
            id={fieldId("dimensions")}
            className="mt-7"
            label={t("dimensions.label")}
            optional
            hint={t("dimensions.hint")}
            error={error("dimensions")}
          >
            {(control) => (
              <TextInput name="dimensions" className="max-w-105" {...control} />
            )}
          </Field>
        </div>

        <div hidden={step !== 2}>
          {stepHeading(2)}
          <div className="grid gap-7 md:grid-cols-3 md:gap-6">
            <Field
              id={fieldId("postalCode")}
              label={t("postalCode")}
              error={error("postalCode")}
            >
              {(control) => (
                <TextInput
                  name="postalCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  {...control}
                />
              )}
            </Field>
            <Field
              id={fieldId("city")}
              className="md:col-span-2"
              label={t("city")}
              error={error("city")}
            >
              {(control) => (
                <TextInput
                  name="city"
                  autoComplete="address-level2"
                  {...control}
                />
              )}
            </Field>
          </div>
          <RadioCards
            id={fieldId("timeframe")}
            className="mt-8"
            name="timeframe"
            legend={t("timeframeLegend")}
            error={error("timeframe")}
            options={TIMEFRAMES.map((value) => ({
              value,
              label: t(`timeframes.${value}`),
            }))}
          />
          <RadioCards
            id={fieldId("budget")}
            className="mt-8"
            name="budget"
            legend={t("budgetLegend")}
            error={error("budget")}
            options={BUDGETS.map((value) => ({
              value,
              label: t(`budgets.${value}`),
            }))}
          />
        </div>

        <div hidden={step !== 3}>
          {stepHeading(3)}
          <Field id={fieldId("name")} label={t("name")} error={error("name")}>
            {(control) => (
              <TextInput
                name="name"
                autoComplete="name"
                className="max-w-105"
                {...control}
              />
            )}
          </Field>
          <Field
            id={fieldId("phone")}
            className="mt-7"
            label={t("phone")}
            hint={t("contactHint")}
            error={error("phone")}
          >
            {(control) => (
              <TextInput
                name="phone"
                type="tel"
                autoComplete="tel"
                className="max-w-105"
                {...control}
              />
            )}
          </Field>
          <Field
            id={fieldId("email")}
            className="mt-7"
            label={t("email")}
            hint={t("contactHint")}
            error={error("email")}
          >
            {(control) => (
              <TextInput
                name="email"
                type="email"
                autoComplete="email"
                className="max-w-105"
                {...control}
              />
            )}
          </Field>
          <RadioCards
            id={fieldId("contactPreference")}
            className="mt-8"
            name="contactPreference"
            legend={t("preferenceLegend")}
            error={error("contactPreference")}
            options={CONTACT_PREFERENCES.map((value) => ({
              value,
              label: t(`preferences.${value}`),
            }))}
          />
        </div>

        {/* The trap: out of sight, out of the tab order, silent for screen readers. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="request-trap">{t("trapLabel")}</label>
          <input
            id="request-trap"
            name={TRAP_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="mt-9 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <Button type="submit" aria-disabled={pending || undefined}>
            {step < LAST_STEP
              ? t("next", { step: step + 1 })
              : pending
                ? t("sending")
                : t("submit")}
          </Button>
          {step > 1 ? (
            <Button
              variant="text"
              onClick={() => goTo((step - 1) as RequestStep)}
            >
              {t("back")}
            </Button>
          ) : null}
        </div>
        <p className="mt-6 text-xs text-schiefer">
          {t.rich("privacy", {
            link: (chunks) => (
              <TextLink href="/datenschutz" tone="plain">
                {chunks}
              </TextLink>
            ),
          })}
        </p>
      </FormCard>
    </>
  );
}
