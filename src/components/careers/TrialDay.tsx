import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ApplyCall } from "./ApplyCall";

type TrialDayProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string | null;
};

/**
 * The trial day for pupils, BRIEF.md section 2, in a Moos band like
 * "So läuft Ihr Auftrag" (01f): a heading, a short text and the way to
 * ask. The home page's "Schnuppertag anfragen" leads here.
 */
export function TrialDay({ phone }: TrialDayProps) {
  const t = useTranslations("CareersPage");

  return (
    <Section variant="moos" labelledBy="schnuppertag-titel">
      <Container>
        <h2 id="schnuppertag-titel" className="font-display text-h2">
          {t("trialTitle")}
        </h2>
        <p className="mt-4 max-w-[34em]">
          {phone ? t("trialText", { phone }) : t("trialTextNoPhone")}
        </p>
        {phone ? (
          <div className="mt-7">
            <ApplyCall phone={phone} />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
