import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TRIAL_DAY_HREF } from "./trial-day-href";

/**
 * The trial day for pupils, BRIEF.md section 2, in a Moos band like
 * "So läuft Ihr Auftrag" (01f): a heading, a short text and the button to
 * the application form below, with "Schnuppertag / Praktikum" chosen. The
 * home page's "Schnuppertag anfragen" leads to the form the same way.
 */
export function TrialDay() {
  const t = useTranslations("CareersPage");

  return (
    <Section variant="moos" labelledBy="schnuppertag-titel">
      <Container>
        <h2 id="schnuppertag-titel" className="font-display text-h2">
          {t("trialTitle")}
        </h2>
        <p className="mt-4 max-w-[34em]">{t("trialText")}</p>
        <div className="mt-7">
          <ButtonLink href={TRIAL_DAY_HREF} className="w-full md:w-auto">
            {t("trialCta")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
