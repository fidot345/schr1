import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import type { HomeContent } from "@/lib/content";

type HomeHeroProps = {
  hero: HomeContent["hero"];
};

/**
 * First screen, BRIEF.md section 2: title and line from the admin panel,
 * "Projekt anfragen" and "Jobs bei uns", the big photo. The photo is 4:5
 * on phones and 3:2 from md, cropped around its focal point; it is the
 * page's largest element, so it loads first.
 */
export function HomeHero({ hero }: HomeHeroProps) {
  const t = useTranslations("HomePage");

  return (
    <section aria-labelledby="home-hero-title" className="pt-8 md:pt-12">
      <Container className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Heading level={1} id="home-hero-title">
            {hero.title}
          </Heading>
          <p className="max-w-measure text-lead">{hero.text}</p>
          <div className="flex flex-wrap gap-4">
            <Button href="/anfrage">{t("requestCta")}</Button>
            <Button href="/karriere" variant="secondary">
              {t("jobsCta")}
            </Button>
          </div>
        </div>
        <div className="lg:col-span-7">
          <CmsImage
            photo={hero.photo}
            frameClassName="aspect-4/5 md:aspect-3/2"
            sizes="(min-width: 80rem) 730px, (min-width: 64rem) 58vw, 100vw"
            priority
          />
        </div>
      </Container>
    </section>
  );
}
