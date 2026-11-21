import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Section } from "./Section";

type RequestCtaProps = {
  /** Unique on the page, for example "services-request". */
  id: string;
};

/**
 * The request button at the end of a page, BRIEF.md section 2. It leads to
 * /anfrage; the request form (stage 4) will also take the type of work.
 */
export function RequestCta({ id }: RequestCtaProps) {
  const t = useTranslations("RequestCta");

  return (
    <Section id={id} title={t("title")} tone="moos">
      <p className="max-w-measure text-lead">{t("text")}</p>
      <div>
        <Button href="/anfrage">{t("button")}</Button>
      </div>
    </Section>
  );
}
