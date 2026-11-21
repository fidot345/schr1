import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TeamMember } from "@/lib/content";

type TeamListProps = {
  team: TeamMember[];
};

/**
 * The team of /ueber-uns, BRIEF.md section 2: name, role and the year in
 * the workshop, as a list between lines. No photos: the brief wants names
 * and roles, not stock faces. A description list, so a screen reader reads
 * each person as "name, role, since …". No section without people.
 */
export function TeamList({ team }: TeamListProps) {
  const t = useTranslations("AboutPage");
  if (team.length === 0) {
    return null;
  }

  return (
    <Section labelledBy="team-titel">
      <Container>
        <SectionHeading id="team-titel" title={t("teamTitle")} />
        <dl className="mt-8 border-b border-linie">
          {team.map((member) => (
            <div
              key={member.id}
              className="grid gap-x-8 gap-y-1 border-t border-linie py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] md:items-baseline"
            >
              <dt className="font-display text-h4">{member.name}</dt>
              <dd>{member.role}</dd>
              <dd className="text-small text-schiefer">
                {t("since", { year: String(member.since) })}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
