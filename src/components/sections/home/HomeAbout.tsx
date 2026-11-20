import { useTranslations } from "next-intl";
import { TextLink } from "@/components/ui/TextLink";
import type { TextBlock } from "@/lib/content";
import { Section } from "../Section";

type HomeAboutProps = {
  block: TextBlock;
};

/** "Familienbetrieb seit 1989": a few paragraphs and "Mehr über uns", BRIEF.md section 2. */
export function HomeAbout({ block }: HomeAboutProps) {
  const t = useTranslations("HomePage");

  return (
    <Section id="home-about" title={block.title}>
      <div className="flex flex-col gap-4">
        {block.paragraphs.map((paragraph) => (
          <p key={paragraph} className="max-w-measure text-lead">
            {paragraph}
          </p>
        ))}
      </div>
      <p>
        <TextLink href="/ueber-uns">{t("aboutMore")}</TextLink>
      </p>
    </Section>
  );
}
