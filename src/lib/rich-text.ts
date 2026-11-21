/*
 * Small readers for the Lexical editor state of a rich text field, without
 * the editor: the state is plain JSON of nodes with a type and children.
 */

type LexicalState = { root: { children?: unknown } };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const childrenOf = (node: unknown): unknown[] =>
  isObject(node) && Array.isArray(node.children) ? node.children : [];

/** The text of a node and everything inside it, line breaks as spaces. */
const textOf = (node: unknown): string => {
  if (!isObject(node)) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (node.type === "linebreak") return " ";
  return childrenOf(node).map(textOf).join("");
};

/**
 * The plain text of the first paragraph that has any, with spaces tidied up;
 * null when there is none. Headings and lists before it are skipped.
 */
export function firstParagraphText(
  state: LexicalState | null | undefined,
): string | null {
  for (const node of childrenOf(state?.root)) {
    if (!isObject(node) || node.type !== "paragraph") continue;
    const text = textOf(node).replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return null;
}
