import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * The white card around the fields of a form, mockup 03: Linie frame, 4px
 * corners, padding clamp(24px, 3vw, 40px). It is the <form> itself, so a page
 * passes `action`, `noValidate` and the rest as to any form.
 */
export function FormCard({ className, ...rest }: ComponentProps<"form">) {
  return (
    <form
      className={cn(
        "rounded border border-linie bg-weiss p-[clamp(1.5rem,3vw,2.5rem)]",
        className,
      )}
      {...rest}
    />
  );
}
