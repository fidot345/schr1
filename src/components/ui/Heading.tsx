import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type HeadingLevel = 1 | 2 | 3 | 4;

const SIZE_CLASS: Record<HeadingLevel, string> = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
  4: "text-h4",
};

type HeadingProps = {
  /** Document outline: renders h1–h4. */
  level: HeadingLevel;
  /** Visual size only. Defaults to the level. */
  size?: HeadingLevel;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Heading({
  level,
  size = level,
  id,
  className,
  children,
}: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      id={id}
      className={cn("font-heading font-semibold", SIZE_CLASS[size], className)}
    >
      {children}
    </Tag>
  );
}
