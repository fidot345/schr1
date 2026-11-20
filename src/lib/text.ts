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
 * The word of the logo, BRIEF.md section 3: the family name "Tannrieder"
 * from the company name in SiteSettings ("Schreinerei Tannrieder").
 * The schema has no field of its own for it, so it is the last word of
 * the name; a one-word name is used as it is.
 */
export const brandWord = (companyName: string): string => {
  const words = companyName.trim().split(/\s+/);
  return words[words.length - 1] ?? "";
};
