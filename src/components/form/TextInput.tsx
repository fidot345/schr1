import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_STYLE } from "./control-style";

/**
 * A one-line field, 52px high. It takes the props a Field hands to its control
 * (id, aria-describedby, aria-invalid) and any other attribute of an <input>.
 * The width is that of its row; a page narrows it with className (max-w-*).
 */
export function TextInput({
  className,
  type = "text",
  ...rest
}: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(CONTROL_STYLE, "h-13 px-4", className)}
      {...rest}
    />
  );
}
