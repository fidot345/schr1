/**
 * Paragraphs of a textarea from the admin panel: separated by an empty line
 * (the field's description says so). Single line breaks stay inside the
 * paragraph, empty paragraphs are dropped.
 */
export const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

/**
 * The word of the logo, BRIEF.md section 3: "Tannrieder", from its own
 * field in SiteSettings. The column is nullable (it came after the first
 * settings were saved), so until someone fills it in, the header shows the
 * full company name instead of an empty logo.
 */
export const logoWordOf = (company: {
  name: string;
  logoWord?: string | null;
}): string => company.logoWord?.trim() || company.name;
