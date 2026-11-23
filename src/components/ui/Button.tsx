import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { type AppHref, AppLink } from "./AppLink";

/*
 * Buttons from the mockup (01b, 01a, 04). Sizes: 52px, 48px in the header,
 * 44px for the "Menü" button. Hover goes to Tannengrün dunkel. The focus
 * ring comes from the base styles in globals.css.
 *
 * primary:   filled Tannengrün, the main action
 * secondary: Tannengrün frame, the second action next to it
 * text:      the same height, no frame, underlined, for quiet actions
 * menu:      the "Menü" button of the phone header: Feldrand frame, Weiß
 *            ground, always 44px high
 */
export type ButtonVariant = "primary" | "secondary" | "text" | "menu";
export type ButtonSize = "default" | "header";

type StyleProps = {
  variant?: ButtonVariant;
  /** default 52px, header 48px (the menu variant is always 44px). */
  size?: ButtonSize;
  /** Takes the whole width of its row. */
  fullWidth?: boolean;
  /** An icon from ui/icons, placed before the label. */
  icon?: ReactNode;
  className?: string;
};

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded font-bold no-underline [&>svg]:shrink-0";

const HEIGHT: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: { default: "min-h-13 text-ui", header: "min-h-12 text-small" },
  secondary: { default: "min-h-13 text-ui", header: "min-h-12 text-small" },
  text: { default: "min-h-13 text-ui", header: "min-h-12 text-small" },
  menu: { default: "min-h-11 text-small", header: "min-h-11 text-small" },
};

/** Total width of the side padding is the same with and without a frame: 26px, in the header 22px. */
const PADDING: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: { default: "px-6.5", header: "px-5.5" },
  secondary: { default: "px-6", header: "px-5" },
  text: { default: "px-0", header: "px-0" },
  menu: { default: "px-3.5", header: "px-3.5" },
};

const LOOK: Record<ButtonVariant, string> = {
  primary:
    "bg-tannengruen text-weiss hover:bg-tannengruen-dunkel hover:text-weiss",
  secondary:
    "border-2 border-tannengruen text-tannengruen hover:border-tannengruen-dunkel hover:text-tannengruen-dunkel",
  text: "text-tannengruen underline hover:text-tannengruen-dunkel",
  menu: "border border-feldrand bg-weiss text-graphit hover:border-tannengruen-dunkel hover:text-tannengruen-dunkel",
};

/** The classes of a button, for the rare element that cannot be a Button. */
export function buttonClassName({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
}: Pick<StyleProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return cn(
    BASE,
    HEIGHT[variant][size],
    PADDING[variant][size],
    LOOK[variant],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = StyleProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    children: ReactNode;
  };

/** A button that does something on the page. For navigation use ButtonLink. */
export function Button({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = StyleProps &
  Omit<ComponentProps<"a">, "className" | "children" | "href"> & {
    href: AppHref;
    children: ReactNode;
  };

/** A link that looks like a button: to a page, a phone number or an anchor. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <AppLink
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {icon}
      {children}
    </AppLink>
  );
}
