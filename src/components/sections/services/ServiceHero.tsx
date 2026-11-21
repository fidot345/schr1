import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import type { Photo } from "@/lib/media";

type ServiceHeroProps = {
  title: string;
  /** Paragraphs of the introduction. */
  intro: string[];
  photo: Photo | null;
};

/**
 * Top of a service page, BRIEF.md section 2: title, introduction,
 * "Projekt anfragen" and the cover photo (4:5 on phones, 3:2 from md).
 * The photo is the page's largest element, so it loads first.
 */
export function ServiceHero({ title, intro, photo }: ServiceHeroProps) {
  const t = useTranslations("ServicePage");

  return (
    <section aria-labelledby="service-title" className="pt-8 md:pt-12">
      <Container className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Heading level={1} id="service-title">
            {title}
          </Heading>
          {intro.map((paragraph) => (
            <p key={paragraph} className="max-w-measure text-lead">
              {paragraph}
            </p>
          ))}
          <div>
            <Button href="/anfrage">{t("requestCta")}</Button>
          </div>
        </div>
        <div className="lg:col-span-7">
          <CmsImage
            photo={photo}
            frameClassName="aspect-4/5 md:aspect-3/2"
            sizes="(min-width: 80rem) 730px, (min-width: 64rem) 58vw, 100vw"
            priority
          />
        </div>
      </Container>
    </section>
  );
}
