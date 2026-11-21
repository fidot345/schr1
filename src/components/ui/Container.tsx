import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Page width 1280px with the fluid side margin clamp(20px, 3vw, 40px). */
export function Container({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto max-w-page px-gutter", className)} {...rest} />
  );
}
