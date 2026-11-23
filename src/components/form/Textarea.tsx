import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_STYLE } from "./control-style";

/**
 * A multi-line field, five rows by default; the visitor can pull it taller.
 * Like TextInput it takes the props a Field hands to its control.
 */
export function Textarea({
  className,
  rows = 5,
  ...rest
}: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(CONTROL_STYLE, "resize-y px-4 py-3.5", className)}
      {...rest}
    />
  );
}
