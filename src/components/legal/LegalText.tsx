import {
  type JSXConvertersFunction,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import { cn } from "@/lib/cn";
import type { RichTextState } from "@/lib/content";

/*
 * The rich text of the legal pages with the site's type scale. The page has
 * the h1, so a heading of the text is at most an h2. Photos and links to
 * documents are left out: a photo here would not go through next/image
 * (AGENTS.md, rule 5), and a document link has no address on the site. The
 * legal texts are plain text with subheadings, lists and web links.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    switch (node.tag) {
      case "h1":
      case "h2":
        return (
          <h2 className="mt-12 font-display text-h3 first:mt-0">{children}</h2>
        );
      case "h3":
        return <h3 className="mt-8 font-display text-h4">{children}</h3>;
      default: {
        const Tag = node.tag;
        return <Tag className="mt-6 text-ui font-bold">{children}</Tag>;
      }
    }
  },
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return children.length > 0 ? <p className="mt-4">{children}</p> : null;
  },
  list: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return node.tag === "ol" ? (
      <ol className="mt-4 list-decimal space-y-2 pl-6">{children}</ol>
    ) : (
      <ul className="mt-4 list-disc space-y-2 pl-6">{children}</ul>
    );
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    const url = node.fields.linkType === "internal" ? null : node.fields.url;
    if (!url) return <>{children}</>;
    return node.fields.newTab ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={url}>{children}</a>
    );
  },
  upload: () => null,
  relationship: () => null,
});

type LegalTextProps = {
  data: RichTextState;
  className?: string;
};

/** A legal text from SiteSettings, at most 34em wide (68 characters). */
export function LegalText({ data, className }: LegalTextProps) {
  return (
    <RichText
      data={data}
      converters={converters}
      disableIndent
      disableTextAlign
      className={cn("max-w-[34em]", className)}
    />
  );
}
