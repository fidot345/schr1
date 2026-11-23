import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageNotFound } from "@/components/errors/PageNotFound";

/*
 * The 404 of the site, for addresses no page answers ([...rest]) and for
 * pages that call notFound(), such as an unknown service. It sits inside
 * (site)/layout.tsx, so it has the header and footer. A not-found file gets
 * no params: the language comes from setRequestLocale in the layouts.
 */

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // The locale layout's metadata sets the locale. Without it, next-intl
  // would read it from the request headers, and a page built ahead, such
  // as /leistungen/[slug] with an unknown slug, may not read headers.
  await parent;
  const t = await getTranslations("NotFoundPage");
  return { title: t("title") };
}

export default function NotFound() {
  return <PageNotFound />;
}
