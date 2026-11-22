import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { RichTextState } from "@/lib/content";
import { LegalText } from "./LegalText";

type LegalPageProps = {
  /** The id of the h1, the section is named by it. */
  titleId: string;
  title: string;
  body: RichTextState;
  /**
   * The concept note in a Moos box above the text: the Impressum must say
   * first that the firm is fictional (BRIEF.md section 2).
   */
  conceptNote?: boolean;
};

/**
 * Impressum and Datenschutz, laid out like the top of /leistungen: the h1,
 * optionally the concept note, and the text from SiteSettings.
 */
export function LegalPage({
  titleId,
  title,
  body,
  conceptNote = false,
}: LegalPageProps) {
  const tDemo = useTranslations("Demo");

  return (
    <Section
      labelledBy={titleId}
      topSpace="none"
      className="pt-10 pb-16 md:pt-14 md:pb-32"
    >
      <Container>
        {/*
         * "Datenschutzerklärung" is wider than a 360px screen. Chrome on
         * Windows has no German hyphenation for hyphens-auto, so the heading
         * in messages carries a soft hyphen (Datenschutz-erklärung). The
         * classes stay as a safety net for other long words.
         */}
        <h1
          id={titleId}
          className="wrap-break-word hyphens-auto font-display text-h1"
        >
          {title}
        </h1>
        {conceptNote ? (
          <p className="mt-8 max-w-[34em] rounded bg-moos p-6 font-bold">
            {tDemo("notice")}
          </p>
        ) : null}
        <LegalText data={body} className="mt-10" />
      </Container>
    </Section>
  );
}
