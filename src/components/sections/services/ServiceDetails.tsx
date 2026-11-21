import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import type { ListItem } from "@/lib/content";

type ServiceDetailsProps = {
  included: ListItem[];
  materials: ListItem[];
  duration: string | null;
};

const LIST_CLASS =
  "flex max-w-measure list-disc flex-col gap-2 pl-6 marker:text-tannengruen";

/**
 * What the work includes, the materials and how long it usually takes,
 * BRIEF.md section 2. Blocks without content from the admin panel are left
 * out; with none at all, nothing is rendered.
 */
export function ServiceDetails({
  included,
  materials,
  duration,
}: ServiceDetailsProps) {
  const t = useTranslations("ServicePage");
  if (included.length === 0 && materials.length === 0 && !duration) {
    return null;
  }

  return (
    <Container className="grid gap-12 lg:grid-cols-3 lg:gap-8">
      {included.length > 0 && (
        <section
          aria-labelledby="service-included"
          className="flex flex-col gap-6"
        >
          <Heading level={2} size={3} id="service-included">
            {t("includedTitle")}
          </Heading>
          <ul className={LIST_CLASS}>
            {included.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </section>
      )}
      {materials.length > 0 && (
        <section
          aria-labelledby="service-materials"
          className="flex flex-col gap-6"
        >
          <Heading level={2} size={3} id="service-materials">
            {t("materialsTitle")}
          </Heading>
          <ul className={LIST_CLASS}>
            {materials.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </section>
      )}
      {duration && (
        <section
          aria-labelledby="service-duration"
          className="flex flex-col gap-6"
        >
          <Heading level={2} size={3} id="service-duration">
            {t("durationTitle")}
          </Heading>
          <p className="max-w-measure text-lead">{duration}</p>
        </section>
      )}
    </Container>
  );
}
