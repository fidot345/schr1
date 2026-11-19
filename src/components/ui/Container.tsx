import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Page container, BRIEF.md section 3: up to 1280px, 20px / 40px gutters. */
export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-page px-gutter-mobile md:px-gutter-desktop",
        className,
      )}
    >
      {children}
    </div>
  );
}
