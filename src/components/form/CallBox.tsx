import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import type { SiteContent } from "@/lib/content";
import { telHref } from "@/lib/phone";

type CallBoxProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string;
  openingHours: SiteContent["openingHours"];
  className?: string;
};

/**
 * "Lieber telefonieren?", the Moos box under the next steps, mockup 03: the
 * phone number in the size of the scale's tel step, a tel: link, and the
 * opening hours in one line.
 */
export function CallBox({ phone, openingHours, className }: CallBoxProps) {
  const t = useTranslations("Form.callBox");

  return (
    <div className={cn("rounded bg-moos p-6", className)}>
      <h3 className="font-display text-h4">{t("title")}</h3>
      <TextLink
        href={telHref(phone)}
        tone="plain"
        className="mt-2.5 inline-block font-display text-tel no-underline"
      >
        {phone}
      </TextLink>
      <p className="mt-2 text-xs">
        {openingHours
          .map(({ days, hours }) => t("hours", { days, hours }))
          .join(", ")}
      </p>
    </div>
  );
}
