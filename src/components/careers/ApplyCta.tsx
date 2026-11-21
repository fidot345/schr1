import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { ApplyCall } from "./ApplyCall";

type ApplyCtaProps = {
  /** As people write it, from SiteSettings: "089 99998 412". */
  phone: string;
};

/**
 * The end of a job page, in the shape of "Sprechen Sie mit uns" (01j): a
 * white band with a line on top, the heading and a sentence on the left,
 * the button and the link to all open jobs under it.
 */
export function ApplyCta({ phone }: ApplyCtaProps) {
  const t = useTranslations("JobPage");

  return (
    <Section variant="line" labelledBy="bewerben-titel">
      <Container>
        <h2 id="bewerben-titel" className="font-display text-h2">
          {t("applyTitle")}
        </h2>
        <p className="mt-4 max-w-[34em]">{t("applyText", { phone })}</p>
        <div className="mt-7 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <ApplyCall phone={phone} />
          <TextLink href="/karriere">{t("allJobs")}</TextLink>
        </div>
      </Container>
    </Section>
  );
}
