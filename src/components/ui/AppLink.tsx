import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

type InternalHref = ComponentProps<typeof Link>["href"];
type ExternalHref =
  | `tel:${string}`
  | `mailto:${string}`
  | `#${string}`
  | `http://${string}`
  | `https://${string}`;

/**
 * A page of the site (typed against routing.pathnames) or a link that
 * leaves the router: a phone number, an e-mail address, an anchor.
 */
export type AppHref = InternalHref | ExternalHref;

type AppLinkProps = Omit<ComponentProps<"a">, "href"> & { href: AppHref };

const isExternal = (href: AppHref): href is ExternalHref =>
  typeof href === "string" && /^(tel:|mailto:|#|https?:\/\/)/.test(href);

/**
 * Pages of the site go through next-intl's Link, which adds the /en prefix
 * and translates the path. Everything else is a plain anchor.
 */
export function AppLink({ href, ...rest }: AppLinkProps) {
  if (isExternal(href)) {
    return <a href={href} {...rest} />;
  }
  return <Link href={href} {...rest} />;
}
