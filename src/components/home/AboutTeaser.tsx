import { useTranslations } from "next-intl";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";
import type { AboutBlock } from "@/lib/content";

type AboutTeaserProps = Pick<AboutBlock, "title" | "paragraphs" | "photo">;

/**
 * "Familienbetrieb seit 1989", mockup 01h: the "Über uns" block of the
 * admin panel with the link to the about page on the left, its photo on the
 * right, centered on each other. Below 856px of width the photo goes under
 * the text.
 */
export function AboutTeaser({ title, paragraphs, photo }: AboutTeaserProps) {
  const t = useTranslations("HomePage");

  return (
    <Section labelledBy="familie-titel">
      <Container className="flex flex-wrap items-center gap-14">
        <div className="min-w-0 flex-[5_1_380px]">
          <h2 id="familie-titel" className="font-display text-h2">
            {title}
          </h2>
          {paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className={cn("max-w-[34em]", index === 0 ? "mt-5" : "mt-4")}
            >
              {paragraph}
            </p>
          ))}
          <TextLink href="/ueber-uns" className="mt-6 inline-block">
            {t("aboutMore")}
          </TextLink>
        </div>
        <CmsImage
          photo={photo}
          frameClassName="h-72 min-w-0 flex-[6_1_420px] md:h-110"
          sizes="(min-width: 80rem) 640px, (min-width: 56rem) 50vw, 100vw"
        />
      </Container>
    </Section>
  );
}
