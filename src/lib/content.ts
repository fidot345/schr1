import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import type { Job } from "@/payload-types";
import { type Photo, populated, toPhoto } from "./media";
import { payloadClient, readOptions } from "./payload";
import { paragraphs } from "./text";

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
      company: settings.company,
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
