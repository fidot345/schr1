import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getOpenJobs } from "@/lib/content";
import { jobPreview } from "@/lib/preview";
import { previewImageResponse } from "@/lib/preview-image";

/*
 * A job's preview image, /de/og/jobs/schreiner/image.png and
 * /en/og/jobs/joiner/image.png, with the slug of that language: the job,
 * its kind and its start (src/lib/preview.ts). Built ahead for every open
 * job, like the job pages; a job switched on later is drawn on its first
 * request, one that is switched off or unknown gives 404.
 */
export const dynamic = "force-static";

export async function generateStaticParams() {
  const lists = await Promise.all(
    routing.locales.map(async (locale) => ({
      locale,
      jobs: await getOpenJobs(locale),
    })),
  );
  return lists.flatMap(({ locale, jobs }) =>
    jobs.map(({ slug }) => ({ locale, slug })),
  );
}

type RouteProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteProps,
): Promise<Response> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 });
  }

  const preview = await jobPreview(locale, slug);
  if (!preview) {
    return new Response(null, { status: 404 });
  }
  return previewImageResponse(preview.content);
}
