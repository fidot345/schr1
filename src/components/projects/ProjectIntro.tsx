import { useTranslations } from "next-intl";
import { CmsImage } from "@/components/ui/CmsImage";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import type { ProjectDetail } from "@/lib/content";

type ProjectIntroProps = Pick<
  ProjectDetail,
  "title" | "facts" | "service" | "photo"
>;

/**
 * The top of a project page, BRIEF.md section 2, laid out like the top of
 * a service page: from lg the title and the facts (Objekt, Jahr, Dauer,
 * Material and the link to the service) on the left and the cover on the
 * right, bottom edges level; below lg one column with the text first.
 * The facts are rows with Linie between them, like the lists of
 * "Auf einen Blick". The cover is the largest element on screen.
 */
export function ProjectIntro({
  title,
  facts,
  service,
  photo,
}: ProjectIntroProps) {
  const t = useTranslations("ProjectPage");
  const rows = [
    { key: "objectType", label: t("objectType"), value: facts.objectType },
    { key: "year", label: t("year"), value: String(facts.year) },
    { key: "duration", label: t("duration"), value: facts.duration },
    { key: "material", label: t("material"), value: facts.material },
  ];

  return (
    <Section
      labelledBy="referenz-titel"
      topSpace="none"
      className="pt-10 md:pt-14"
    >
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-12">
        <div className="min-w-0 max-w-135 lg:flex-[1_1_400px] lg:pb-2">
          <h1 id="referenz-titel" className="font-display text-h1">
            {title}
          </h1>
          <dl className="mt-8 divide-y divide-linie text-ui">
            {rows.map((row) => (
              <div key={row.key} className="flex gap-4 py-3 first:pt-0">
                <dt className="w-32 shrink-0 text-schiefer">{row.label}</dt>
                <dd className="min-w-0">{row.value}</dd>
              </div>
            ))}
            {service ? (
              <div className="flex gap-4 py-3">
                <dt className="w-32 shrink-0 text-schiefer">{t("service")}</dt>
                <dd className="min-w-0">
                  <TextLink
                    href={{
                      pathname: "/leistungen/[slug]",
                      params: { slug: service.slug },
                    }}
                  >
                    {service.title}
                  </TextLink>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="min-w-0 lg:flex-[1.4_1_520px]">
          <CmsImage
            photo={photo}
            frameClassName="aspect-4/5 md:aspect-3/2"
            sizes="(min-width: 80rem) 700px, (min-width: 64rem) 58vw, 100vw"
            priority
          />
        </div>
      </Container>
    </Section>
  );
}
