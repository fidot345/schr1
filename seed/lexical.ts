import type { SiteSetting } from "../src/payload-types";

export type RichText = SiteSetting["imprint"];

/** A block of the legal texts: a subheading or a paragraph. */
export type TextBlock = { h2: string } | { p: string };

const text = (value: string) => ({
  type: "text",
  version: 1,
  text: value,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
});

const node = (block: TextBlock) =>
  "h2" in block
    ? {
        type: "heading",
        tag: "h2",
        version: 1,
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
        children: [text(block.h2)],
      }
    : {
        type: "paragraph",
        version: 1,
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
        textFormat: 0,
        textStyle: "",
        children: [text(block.p)],
      };

/** Lexical editor state for a simple text of subheadings and paragraphs. */
export const richText = (blocks: TextBlock[]): RichText => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: blocks.map(node),
  },
});
