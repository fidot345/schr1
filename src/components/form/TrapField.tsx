import { useTranslations } from "next-intl";
import { TRAP_FIELD } from "@/lib/form-schema";

/**
 * The spam trap of a form, BRIEF.md section 5 "Formen": a field a bot fills
 * in and a person never sees. Out of sight, out of the tab order, silent
 * for screen readers; the label only tells a person who still reaches it.
 */
export function TrapField({ id }: { id: string }) {
  const t = useTranslations("Form");

  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={id}>{t("trapLabel")}</label>
      <input
        id={id}
        name={TRAP_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
