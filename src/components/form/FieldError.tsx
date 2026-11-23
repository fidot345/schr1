import { useTranslations } from "next-intl";
import { ErrorIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type FieldErrorProps = {
  /** The control or group points to it with aria-describedby. */
  id: string;
  message: string;
  className?: string;
};

/**
 * The error under a field or a group of choices, mockup 03: bold Fehler text
 * with its icon. The "Fehler:" before it is read aloud only, so the red
 * color and the icon are not the only sign.
 */
export function FieldError({ id, message, className }: FieldErrorProps) {
  const t = useTranslations("Form");

  return (
    <p
      id={id}
      className={cn(
        "flex items-start gap-2 text-small font-bold text-fehler",
        className,
      )}
    >
      <ErrorIcon className="mt-px shrink-0" />
      <span>
        <span className="sr-only">{t("errorPrefix")} </span>
        {message}
      </span>
    </p>
  );
}
