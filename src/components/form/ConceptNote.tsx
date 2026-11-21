import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

/**
 * "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives
 * Unternehmen." under every form (the demo rule of AGENTS.md), mockup 03.
 */
export function ConceptNote({ className }: { className?: string }) {
  const t = useTranslations("Demo");

  return (
    <p className={cn("text-xs text-schiefer", className)}>{t("notice")}</p>
  );
}
