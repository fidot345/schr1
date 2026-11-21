import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneIcon } from "@/components/ui/icons";
import { telHref } from "@/lib/phone";

type ApplyCallProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string;
};

/**
 * How to apply until the application form is built (stage 4, BRIEF.md
 * section 6): a button that calls the workshop. It is the only place to
 * replace with the form on /karriere and on a job page.
 * TEMP(stage-4): the form takes its place.
 */
export function ApplyCall({ phone }: ApplyCallProps) {
  const t = useTranslations("JobPage");

  return (
    <ButtonLink
      href={telHref(phone)}
      icon={<PhoneIcon />}
      className="w-full md:w-auto"
    >
      {t("call")}
    </ButtonLink>
  );
}
