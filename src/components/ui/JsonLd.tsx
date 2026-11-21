type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Structured data for search engines as a script tag, the way the Next.js
 * guide to JSON-LD has it. `<` becomes < so that no text of the
 * admin panel can close the tag.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the data is serialized by us and `<` is escaped, as in the Next.js JSON-LD guide.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
