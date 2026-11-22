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

/** A step of "Vom Brett zum Schrank": its name and what happens. */
export type SceneStep = {
  /** "Zuschnitt"; null when the caption has no name in front. */
  title: string | null;
  text: string;
};

/** The longest name of a step that still counts as one ("Innenleben" has 10). */
const MAX_STEP_NAME = 30;

/**
 * A caption of the 3D scene, BRIEF.md section 4, split into the step's name
 * and its text: "Zuschnitt: Jedes Teil …" or "Fertig. Vom Aufmaß …". The
 * admin panel keeps each caption as one line, as the brief writes them; the
 * section shows the name as the step's heading. The text starts with a
 * capital letter ("Cutting: every part …" → "Every part …"). Without a short
 * name in front, the whole caption is the text.
 */
export const sceneStep = (caption: string): SceneStep => {
  const trimmed = caption.trim();
  const match = /^([^:.]+)[:.]\s+(\S[\s\S]*)$/.exec(trimmed);
  const name = match?.[1]?.trim();
  const rest = match?.[2];
  if (!name || !rest || name.length > MAX_STEP_NAME) {
    return { title: null, text: trimmed };
  }
  return {
    title: name,
    text: rest.charAt(0).toLocaleUpperCase() + rest.slice(1),
  };
};
