import { useTranslations } from "next-intl";
import type { AppHref } from "@/components/ui/AppLink";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";

type RequestCtaProps = {
  /** A quiet way on next to the button, "Alle Leistungen ansehen". */
  link?: { href: AppHref; label: string };
};

/**
 * The request button at the end of a page: a white band with a line on top,
 * like "Sprechen Sie mit uns" (01j). The heading and a sentence on the
 * left, the button (full width on the phone) and the optional link under it.
 */
export function RequestCta({ link }: RequestCtaProps) {
  const t = useTranslations("RequestCta");

  return (
    <Section variant="line" labelledBy="anfrage-titel">
      <Container>
        <h2 id="anfrage-titel" className="font-display text-h2">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-[34em]">{t("text")}</p>
        <div className="mt-7 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <ButtonLink href="/anfrage" className="w-full md:w-auto">
            {t("button")}
          </ButtonLink>
          {link ? <TextLink href={link.href}>{link.label}</TextLink> : null}
        </div>
      </Container>
    </Section>
  );
}
