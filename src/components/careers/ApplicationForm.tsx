"use client";

/*
 * Client component: the hints while typing, the focus on the first error,
 * the choice from ?stelle= and useActionState for the server's answer all
 * need the browser.
 */

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  Suspense,
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ErrorSummary, type FormError } from "@/components/form/ErrorSummary";
import { Field } from "@/components/form/Field";
import { FormCard } from "@/components/form/FormCard";
import { useFillTime, useFocusAfterRender } from "@/components/form/form-hooks";
import { RadioCards } from "@/components/form/RadioCards";
import { SendFailed } from "@/components/form/SendFailed";
import { Textarea } from "@/components/form/Textarea";
import { TextInput } from "@/components/form/TextInput";
import { TrapField } from "@/components/form/TrapField";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { submitApplication } from "@/lib/application-action";
import {
  APPLICATION_FIELDS,
  type ApplicationErrors,
  type ApplicationField,
  type ApplicationState,
  applicationInput,
  CALL_TIMES,
  EXPERIENCES,
  firstApplicationError,
  isApplicationField,
  JOB_PARAM,
  TRIAL_DAY,
  validateApplication,
} from "@/lib/application-schema";

const INITIAL_STATE: ApplicationState = { status: "idle" };

const fieldId = (field: ApplicationField) => `application-${field}`;
const FAILED_ID = "application-failed";

export type ApplicationJob = {
  /** Payload's id: what the form sends. */
  id: number;
  title: string;
};

type ApplicationFormProps = {
  /** The open jobs, in their order; the trial day comes after them. */
  jobs: readonly ApplicationJob[];
  /** The job chosen at first: the job page's own. */
  defaultJob?: string;
  /** As people write it, from SiteSettings: for the message when sending fails. */
  phone: string | null;
};

/** The job chosen in the URL; `times` makes the same choice count again. */
type Choice = { job: string | undefined; times: number };

/**
 * Reads ?stelle= and hands a choice to the form. On its own and inside
 * Suspense: useSearchParams renders only this in the browser, while the
 * form around it stays in the prerendered page. It follows the URL, so the
 * trial day's button on the same page (a link to ?stelle=schnuppertag)
 * chooses it, too.
 */
function JobFromUrl({ onChoose }: { onChoose: (job: string) => void }) {
  const job = useSearchParams().get(JOB_PARAM);

  useEffect(() => {
    if (job) {
      onChoose(job);
    }
  }, [job, onChoose]);

  return null;
}

/**
 * The application, BRIEF.md section 5 "Formen": "In 60 Sekunden bewerben –
 * ohne Lebenslauf", one step, "du" as on all careers pages. Sending checks
 * the fields with the same schema as the server: the errors appear under
 * the fields and in a list on top, and the focus moves to the first one.
 * From then on the errors follow the typing and go away as soon as a field
 * is right; never on leaving a field, so a click on the button cannot miss.
 */
export function ApplicationForm({
  jobs,
  defaultJob,
  phone,
}: ApplicationFormProps) {
  const t = useTranslations("ApplicationForm");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    submitApplication.bind(null, locale),
    INITIAL_STATE,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const stampFillTime = useFillTime();
  const setFocusTarget = useFocusAfterRender();
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [checked, setChecked] = useState(false);
  const [choice, setChoice] = useState<Choice>({ job: defaultJob, times: 0 });

  const chooseFromUrl = useCallback(
    (job: string) => {
      if (job === TRIAL_DAY || jobs.some(({ id }) => String(id) === job)) {
        setChoice(({ times }) => ({ job, times: times + 1 }));
      }
    },
    [jobs],
  );

  // A choice from the URL: the visitor asked for the form, so the focus
  // goes to the chosen card; Tab goes on to the name.
  useEffect(() => {
    if (choice.times > 0) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="job"]:checked')
        ?.focus();
    }
  }, [choice]);

  // The server's answer: its errors as if the browser had found them.
  useEffect(() => {
    if (state.status === "invalid") {
      setErrors(state.errors);
      setChecked(true);
      const first = firstApplicationError(state.errors);
      if (first) {
        setFocusTarget(fieldId(first));
      }
    } else if (state.status === "failed") {
      setFocusTarget(FAILED_ID);
    }
  }, [state, setFocusTarget]);

  const check = (): ApplicationErrors => {
    const result = validateApplication(
      applicationInput(new FormData(formRef.current ?? undefined)),
    );
    const found = result.success ? {} : result.errors;
    setErrors(found);
    return found;
  };

  const onChange = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      checked &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement) &&
      isApplicationField(target.name)
    ) {
      check();
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // The action is started by hand, so React does not empty the fields
    // after an error.
    event.preventDefault();
    if (pending) {
      return;
    }
    setChecked(true);
    const first = firstApplicationError(check());
    if (first) {
      setFocusTarget(fieldId(first));
      return;
    }
    const formData = new FormData(event.currentTarget);
    stampFillTime(formData);
    startTransition(() => formAction(formData));
  };

  const error = (field: ApplicationField) => {
    const key = errors[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  const summary: FormError[] = checked
    ? APPLICATION_FIELDS.flatMap((field) => {
        const message = error(field);
        return message ? [{ fieldId: fieldId(field), message }] : [];
      })
    : [];

  const options = <Value extends string>(
    values: readonly Value[],
    label: (value: Value) => string,
  ) => values.map((value) => ({ value, label: label(value) }));

  return (
    <FormCard
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={onSubmit}
      onChange={onChange}
    >
      <Suspense fallback={null}>
        <JobFromUrl onChoose={chooseFromUrl} />
      </Suspense>
      {state.status === "failed" ? (
        <SendFailed id={FAILED_ID} phone={phone} tone="informal" />
      ) : null}
      <ErrorSummary
        errors={summary}
        tone="informal"
        className="mb-8"
        onLinkClick={(id) => document.getElementById(id)?.focus()}
      />

      <RadioCards
        // Chosen from ?stelle= after the first render: a new group then.
        key={`${choice.job ?? "none"}-${choice.times}`}
        id={fieldId("job")}
        name="job"
        legend={t("jobLegend")}
        defaultValue={choice.job}
        error={error("job")}
        options={[
          ...jobs.map(({ id, title }) => ({ value: String(id), label: title })),
          { value: TRIAL_DAY, label: t("trialDay") },
        ]}
      />

      <Field
        id={fieldId("name")}
        className="mt-8"
        label={t("name")}
        error={error("name")}
      >
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
        hint={t("phoneHint")}
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
        optional
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
        id={fieldId("experience")}
        className="mt-8"
        name="experience"
        legend={t("experienceLegend")}
        error={error("experience")}
        options={options(EXPERIENCES, (value) => t(`experiences.${value}`))}
      />
      <Field
        id={fieldId("start")}
        className="mt-8"
        label={t("start.label")}
        hint={t("start.hint")}
        error={error("start")}
      >
        {(control) => (
          <TextInput name="start" className="max-w-105" {...control} />
        )}
      </Field>
      <RadioCards
        id={fieldId("callTime")}
        className="mt-8"
        name="callTime"
        legend={t("callTimeLegend")}
        error={error("callTime")}
        options={options(CALL_TIMES, (value) => t(`callTimes.${value}`))}
      />
      <Field
        id={fieldId("message")}
        className="mt-8"
        label={t("message.label")}
        optional
        hint={t("message.hint")}
        error={error("message")}
      >
        {(control) => <Textarea name="message" rows={4} {...control} />}
      </Field>

      <TrapField id="application-trap" />

      <div className="mt-9 flex flex-col items-stretch md:flex-row">
        <Button type="submit" aria-disabled={pending || undefined}>
          {pending ? t("sending") : t("submit")}
        </Button>
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
  );
}
