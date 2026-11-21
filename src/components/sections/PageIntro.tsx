import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

type PageIntroProps = {
  /** Unique on the page; the h1 gets `${id}-title`. */
  id: string;
  title: string;
  /** The short introduction under the h1. */
  text: string;
  children?: ReactNode;
};

/** The top of a page without a photo: h1 and a short introduction. */
export function PageIntro({ id, title, text, children }: PageIntroProps) {
  const titleId = `${id}-title`;

  return (
    <section aria-labelledby={titleId} className="pt-8 md:pt-12">
      <Container className="flex flex-col gap-6">
        <Heading level={1} id={titleId}>
          {title}
        </Heading>
        <p className="max-w-measure text-lead">{text}</p>
        {children}
      </Container>
    </section>
  );
}
