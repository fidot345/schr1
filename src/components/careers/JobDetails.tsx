import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { JobDetail, ListItem } from "@/lib/content";

type JobDetailsProps = Pick<JobDetail, "tasks" | "requirements" | "benefits">;

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
 * What the job involves, BRIEF.md section 2: tasks, what is expected and
 * what the workshop gives. A Moos band with the lists in a row, like "Auf
 * einen Blick" on a service page; a list without items is left out, and so
 * is the band when all three are empty.
 */
export function JobDetails({ tasks, requirements, benefits }: JobDetailsProps) {
  const t = useTranslations("JobPage");
  const lists = [
    { key: "tasks", title: t("tasksTitle"), items: tasks },
    { key: "requirements", title: t("requirementsTitle"), items: requirements },
    { key: "benefits", title: t("benefitsTitle"), items: benefits },
  ].filter((list) => list.items.length > 0);
  if (lists.length === 0) {
    return null;
  }

  return (
    <Section variant="moos" labelledBy="details-titel">
      <Container>
        <SectionHeading id="details-titel" title={t("detailsTitle")} />
        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10">
          {lists.map((list) => (
            <div key={list.key}>
              <h3 className="font-display text-h4">{list.title}</h3>
              <ItemList items={list.items} />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
