import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";

/**
 * The 404 page, BRIEF.md section 2: a short text and the ways on, to the
 * home page, the services and the contact page, in the page's language.
 */
export function PageNotFound() {
  const t = useTranslations("NotFoundPage");

  return (
    <Section
      labelledBy="nicht-gefunden-titel"
      topSpace="none"
      className="pt-10 pb-16 md:pt-14 md:pb-32"
    >
      <Container>
        <h1 id="nicht-gefunden-titel" className="font-display text-h1">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[34em] text-lead">{t("text")}</p>
        <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
          <ButtonLink href="/" className="w-full md:w-auto">
            {t("home")}
          </ButtonLink>
          <ButtonLink
            href="/leistungen"
            variant="secondary"
            className="w-full md:w-auto"
          >
            {t("services")}
          </ButtonLink>
          <TextLink href="/kontakt">{t("contact")}</TextLink>
        </div>
      </Container>
    </Section>
  );
}
