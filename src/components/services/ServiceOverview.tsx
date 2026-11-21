import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ListItem } from "@/lib/content";

type ServiceOverviewProps = {
  included: ListItem[];
  materials: ListItem[];
  duration: string | null;
};

function ItemList({ items }: { items: ListItem[] }) {
  return (
    <ul className="mt-4 divide-y divide-linie text-ui">
      {items.map((item) => (
        <li key={item.id} className="py-3 first:pt-0">
          {item.text}
        </li>
      ))}
    </ul>
  );
}

/**
 * A service at a glance, BRIEF.md section 2: what is included, the
 * materials and how long it usually takes. A Moos band with the parts in a
 * row, like "So läuft Ihr Auftrag" (01f); a part without content is left
 * out, and so is the band when all three are empty.
 */
export function ServiceOverview({
  included,
  materials,
  duration,
}: ServiceOverviewProps) {
  const t = useTranslations("ServicePage");
  if (included.length === 0 && materials.length === 0 && !duration) {
    return null;
  }

  return (
    <Section variant="moos" labelledBy="ueberblick-titel">
      <Container>
        <SectionHeading id="ueberblick-titel" title={t("overviewTitle")} />
        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10">
          {included.length > 0 ? (
            <div>
              <h3 className="font-display text-h4">{t("includedTitle")}</h3>
              <ItemList items={included} />
            </div>
          ) : null}
          {materials.length > 0 ? (
            <div>
              <h3 className="font-display text-h4">{t("materialsTitle")}</h3>
              <ItemList items={materials} />
            </div>
          ) : null}
          {duration ? (
            <div>
              <h3 className="font-display text-h4">{t("durationTitle")}</h3>
              <p className="mt-4 text-ui">{duration}</p>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
