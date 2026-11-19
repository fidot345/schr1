import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { type InternalHref, textLinkClassName } from "./TextLink";

export type ButtonVariant = "primary" | "secondary" | "text";

const BASE_CLASS =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded text-body font-bold";

const BOX_CLASS =
  "border-2 px-6 py-2 text-center motion-safe:transition-colors";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: cn(
    BOX_CLASS,
    "border-tannengruen bg-tannengruen text-weiss",
    "hover:border-tannengruen-dunkel hover:bg-tannengruen-dunkel",
    "active:border-tannengruen-dunkel active:bg-tannengruen-dunkel",
  ),
  secondary: cn(
    BOX_CLASS,
    "border-tannengruen text-tannengruen",
    "hover:border-tannengruen-dunkel hover:bg-moos hover:text-tannengruen-dunkel",
    "active:border-tannengruen-dunkel active:bg-moos active:text-tannengruen-dunkel",
  ),
  text: textLinkClassName,
};

/**
 * Classes of a button, for elements Button does not render itself
 * (for example a tel: link in the mobile bar).
 */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(BASE_CLASS, VARIANT_CLASS[variant], className);
}

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    href?: never;
  };

type ButtonAsLink = CommonProps & {
  href: InternalHref;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { href, variant, className, children } = props;
    return (
      <Link href={href} className={buttonClassName(variant, className)}>
        {children}
      </Link>
    );
  }

  const { variant, className, children, type = "button", ...rest } = props;
  return (
    <button
      {...rest}
      type={type}
      className={buttonClassName(variant, className)}
    >
      {children}
    </button>
  );
}
