import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import { telHref } from "@/lib/phone";
import type { FormTone } from "./ErrorSummary";

type SendFailedProps = {
  /** The form moves the focus here, so the message is read at once. */
  id: string;
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string | null;
  tone: FormTone;
};

/**
 * "Das hat leider nicht geklappt. Bitte rufen Sie uns an: 089 99998 412."
 * on top of a form when the mail could not be sent, BRIEF.md section 5
 * "Formen", in the frame of the error list. Without a phone number it asks
 * to try again later.
 */
export function SendFailed({ id, phone, tone }: SendFailedProps) {
  const t = useTranslations("Form.sendFailed");
  const tel = telHref(phone);

  return (
    <p
      id={id}
      role="alert"
      tabIndex={-1}
      className="mb-8 rounded border-2 border-fehler bg-weiss px-6 py-5 font-bold"
    >
      {tel && phone
        ? t.rich(tone, {
            phone,
            link: (chunks) => <TextLink href={tel}>{chunks}</TextLink>,
          })
        : t(tone === "formal" ? "noPhoneFormal" : "noPhoneInformal")}
    </p>
  );
}
