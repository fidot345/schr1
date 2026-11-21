import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { getDemoSite } from "@/content/demo-site";
import { routing } from "@/i18n/routing";

type SiteLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * The shell of every page of the site, docs/REDESIGN.md, session 3:
 * the header and the page in <main>. The footer, the mobile bar and the
 * holiday notice follow in the next commit. The route group adds no segment
 * to the address.
 */
export default async function SiteLayout({
  children,
  params,
}: SiteLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const { company } = getDemoSite(locale);

  return (
    <>
      <Header companyName={company.name} brandName={company.logoWord} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
