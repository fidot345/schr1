import { cache } from "react";
import type { SlugTranslations } from "@/i18n/locale-switch-href";
import { type Locale, routing } from "@/i18n/routing";
import type { Job } from "@/payload-types";
import { type Photo, populated, toPhoto } from "./media";
import { payloadClient, readOptions } from "./payload";
import { logoWordOf, paragraphs } from "./text";

/*
 * Reading the site's content from Payload, BRIEF.md section 5.
 *
 * Every function takes the page's locale; empty English fields fall back to
 * German (see readOptions). Results are plain view data for the components,
 * with photos already resolved. React's cache() runs each read once per
 * render, so the layout and the page can both ask for the site settings.
 *
 * Pages are built ahead (generateStaticParams); after a save in the admin
 * panel the revalidate hook rebuilds them, see src/hooks/revalidate-site.ts.
 */

export type CompanyData = {
  name: string;
  /** Next to the mark in the header: "Tannrieder". */
  logoWord: string;
  owner: string;
  street: string;
  postalCode: string;
  city: string;
  /** As people write it: "089 99998 412". */
  phone: string;
  email: string;
};

export type OpeningHoursRow = {
  id: string;
  days: string;
  hours: string;
};

export type Vacation = {
  /** ISO dates from Payload. */
  from: string;
  until: string;
};

export type SiteContent = {
  company: CompanyData;
  openingHours: OpeningHoursRow[];
  /** Only when the holiday notice is switched on and both dates are set. */
  vacation: Vacation | null;
};

export const getSiteSettings = cache(
  async (locale: Locale): Promise<SiteContent> => {
    const payload = await payloadClient();
    const settings = await payload.findGlobal({
      slug: "site-settings",
      ...readOptions(locale),
      depth: 0,
      select: { company: true, openingHours: true, vacation: true },
    });

    const { enabled, from, until } = settings.vacation ?? {};

    return {
      company: { ...settings.company, logoWord: logoWordOf(settings.company) },
      openingHours: (settings.openingHours ?? []).map((row, index) => ({
        id: row.id ?? String(index),
        days: row.days,
        hours: row.hours,
      })),
      vacation: enabled && from && until ? { from, until } : null,
    };
  },
);

export type ServiceCard = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  photo: Photo | null;
};

/** All services in the admin panel's order. */
export const getServices = cache(
  async (locale: Locale): Promise<ServiceCard[]> => {
    const payload = await payloadClient();
    const { docs } = await payload.find({
      collection: "services",
      ...readOptions(locale),
      depth: 1,
      sort: "order",
      pagination: false,
      select: { title: true, slug: true, summary: true, cover: true },
    });

    return docs.map((service) => ({
      id: service.id,
      title: service.title,
      slug: service.slug,
      summary: service.summary,
      photo: toPhoto(service.cover),
    }));
  },
);

export type ProjectCard = {
  id: number;
  title: string;
  slug: string;
  objectType: string;
  year: number;
  photo: Photo | null;
};

/** A line of a text list from the admin panel ("Was dazugehört"). */
export type ListItem = {
  id: string;
  text: string;
};

const listItems = (
  rows: readonly { id?: string | null; text: string }[] | null | undefined,
): ListItem[] =>
  (rows ?? []).map((row, index) => ({
    id: row.id ?? String(index),
    text: row.text,
  }));

export type ServiceDetail = {
  id: number;
  title: string;
  summary: string;
  intro: string[];
  included: ListItem[];
  materials: ListItem[];
  duration: string | null;
  photo: Photo | null;
  gallery: Photo[];
  /** Projects of this service from "Referenzen", in their order. */
  projects: ProjectCard[];
  /** The service's slug in every language, for alternates and the language switch. */
  slugs: Record<Locale, string>;
  meta: {
    title: string | null;
    description: string | null;
  };
};

/**
 * The slug of every service in each language, by id. getServices is what
 * generateStaticParams lists, so lookups agree with the built pages, also
 * when an English slug is missing and the German one stands in.
 */
const serviceSlugsByLocale = async (): Promise<
  Record<Locale, Map<number, string>>
> => {
  const lists = await Promise.all(
    routing.locales.map((code) => getServices(code)),
  );
  return Object.fromEntries(
    routing.locales.map((code, index) => [
      code,
      new Map((lists[index] ?? []).map(({ id, slug }) => [id, slug])),
    ]),
  ) as Record<Locale, Map<number, string>>;
};

/** One service by its slug in this language, or null when there is none. */
export const getService = cache(
  async (locale: Locale, slug: string): Promise<ServiceDetail | null> => {
    const match = (await getServices(locale)).find(
      (service) => service.slug === slug,
    );
    if (!match) return null;

    const payload = await payloadClient();
    const [service, { docs: projects }, slugsByLocale] = await Promise.all([
      payload.findByID({
        collection: "services",
        id: match.id,
        ...readOptions(locale),
        depth: 1,
        disableErrors: true,
        select: {
          title: true,
          summary: true,
          intro: true,
          included: true,
          materials: true,
          duration: true,
          cover: true,
          gallery: true,
          meta: true,
        },
      }),
      payload.find({
        collection: "projects",
        ...readOptions(locale),
        depth: 1,
        sort: "order",
        pagination: false,
        where: { service: { equals: match.id } },
        select: {
          title: true,
          slug: true,
          objectType: true,
          year: true,
          cover: true,
        },
      }),
      serviceSlugsByLocale(),
    ]);
    if (!service) return null;

    return {
      id: service.id,
      title: service.title,
      summary: service.summary,
      intro: paragraphs(service.intro),
      included: listItems(service.included),
      materials: listItems(service.materials),
      duration: service.duration?.trim() || null,
      photo: toPhoto(service.cover),
      gallery: (service.gallery ?? [])
        .map(toPhoto)
        .filter((photo): photo is Photo => photo !== null),
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        objectType: project.objectType,
        year: project.year,
        photo: toPhoto(project.cover),
      })),
      slugs: Object.fromEntries(
        routing.locales.map((code) => [
          code,
          slugsByLocale[code].get(match.id) ?? slug,
        ]),
      ) as Record<Locale, string>,
      meta: {
        title: service.meta?.title ?? null,
        description: service.meta?.description ?? null,
      },
    };
  },
);

/**
 * For the language switch in the header: on pages whose slug is
 * translated, the slug of this language → the slug in each other language.
 */
export const getSlugTranslations = cache(
  async (locale: Locale): Promise<SlugTranslations> => {
    const services = await serviceSlugsByLocale();
    const here = services[locale];

    return {
      "/leistungen/[slug]": Object.fromEntries(
        routing.locales
          .filter((code) => code !== locale)
          .map((code) => [
            code,
            Object.fromEntries(
              [...here].map(([id, slug]) => [
                slug,
                services[code].get(id) ?? slug,
              ]),
            ),
          ]),
      ),
    };
  },
);

export type JobListItem = {
  id: number;
  title: string;
  slug: string;
  employmentType: Job["employmentType"];
};

/** Open positions (switched on in the admin panel), in their order. */
export const getOpenJobs = cache(
  async (locale: Locale): Promise<JobListItem[]> => {
    const payload = await payloadClient();
    const { docs } = await payload.find({
      collection: "jobs",
      ...readOptions(locale),
      depth: 0,
      sort: "order",
      pagination: false,
      where: { active: { equals: true } },
      select: { title: true, slug: true, employmentType: true },
    });

    return docs.map((job) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      employmentType: job.employmentType,
    }));
  },
);

export type TestimonialItem = {
  id: number;
  quote: string;
  author: string;
};

/** The first testimonials in the admin panel's order. */
export const getTestimonials = cache(
  async (locale: Locale, limit: number): Promise<TestimonialItem[]> => {
    const payload = await payloadClient();
    const { docs } = await payload.find({
      collection: "testimonials",
      ...readOptions(locale),
      depth: 0,
      sort: "order",
      limit,
      select: { quote: true, author: true },
    });

    return docs.map(({ id, quote, author }) => ({ id, quote, author }));
  },
);

export type ProcessStep = {
  id: string;
  title: string;
  text: string;
};

export type SceneCaption = {
  id: string;
  text: string;
};

export type TextBlock = {
  title: string;
  paragraphs: string[];
};

export type HomeContent = {
  hero: {
    title: string;
    text: string;
    photo: Photo | null;
  };
  featuredProjects: ProjectCard[];
  processSteps: ProcessStep[];
  sceneCaptions: SceneCaption[];
  about: TextBlock;
  careers: TextBlock;
  meta: {
    title: string | null;
    description: string | null;
  };
};

/** The HomePage global with its photo and the three chosen projects. */
export const getHomePage = cache(
  async (locale: Locale): Promise<HomeContent> => {
    const payload = await payloadClient();
    // depth 2: home page → project → its cover photo.
    const home = await payload.findGlobal({
      slug: "home-page",
      ...readOptions(locale),
      depth: 2,
      populate: {
        projects: {
          title: true,
          slug: true,
          objectType: true,
          year: true,
          cover: true,
        },
      },
    });

    return {
      hero: {
        title: home.hero.title,
        text: home.hero.text,
        photo: toPhoto(home.hero.image),
      },
      featuredProjects: populated(home.featuredProjects).map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        objectType: project.objectType,
        year: project.year,
        photo: toPhoto(project.cover),
      })),
      processSteps: (home.processSteps ?? []).map((step, index) => ({
        id: step.id ?? String(index),
        title: step.title,
        text: step.text,
      })),
      sceneCaptions: (home.sceneCaptions ?? []).map((caption, index) => ({
        id: caption.id ?? String(index),
        text: caption.text,
      })),
      about: {
        title: home.about.title,
        paragraphs: paragraphs(home.about.text),
      },
      careers: {
        title: home.careers.title,
        paragraphs: paragraphs(home.careers.text),
      },
      meta: {
        title: home.meta?.title ?? null,
        description: home.meta?.description ?? null,
      },
    };
  },
);
