import { cache } from "react";
import type { SlugTranslations } from "@/i18n/locale-switch-href";
import { type Locale, routing } from "@/i18n/routing";
import type { Job, Project, SiteSetting } from "@/payload-types";
import { type JobPay, toJobPay } from "./job-pay";
import { isPopulated, type Photo, populated, toPhoto } from "./media";
import { payloadClient, readOptions } from "./payload";
import { firstParagraphText } from "./rich-text";
import {
  filled,
  logoWordOf,
  paragraphs,
  type SceneStep,
  sceneStep,
} from "./text";

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

/**
 * The company from SiteSettings. Payload requires the fields, but a database
 * whose settings were never saved (a fresh preview branch) has none, so the
 * contact fields are null when empty and the pages leave out what is
 * missing instead of breaking.
 */
export type CompanyData = {
  /** "" when empty. */
  name: string;
  /** Next to the mark in the header: "Tannrieder". */
  logoWord: string;
  /** "" when empty. */
  owner: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  /** As people write it: "089 99998 412". */
  phone: string | null;
  email: string | null;
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
  /** The line under the logo in the footer; null when the field is empty. */
  tagline: string | null;
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
      select: {
        company: true,
        tagline: true,
        openingHours: true,
        vacation: true,
      },
    });

    const { enabled, from, until } = settings.vacation ?? {};
    // Partial: a database without saved settings has no group at all, or
    // one with null fields.
    const company: Partial<SiteSetting["company"]> = settings.company ?? {};

    return {
      company: {
        name: filled(company.name) ?? "",
        logoWord: logoWordOf(company),
        owner: filled(company.owner) ?? "",
        street: filled(company.street),
        postalCode: filled(company.postalCode),
        city: filled(company.city),
        phone: filled(company.phone),
        email: filled(company.email),
      },
      tagline: filled(settings.tagline),
      // A row without days or hours would read "Mo–Do Uhr"; it is left out.
      openingHours: (settings.openingHours ?? []).flatMap((row, index) => {
        const days = filled(row.days);
        const hours = filled(row.hours);
        return days && hours
          ? [{ id: row.id ?? String(index), days, hours }]
          : [];
      }),
      vacation: enabled && from && until ? { from, until } : null,
    };
  },
);

export type ContactDetails = SiteContent & {
  /** "Wo wir arbeiten", in paragraphs. */
  serviceArea: string[];
};

/** The contact page: company data, opening hours and the area of work. */
export const getContactDetails = cache(
  async (locale: Locale): Promise<ContactDetails> => {
    const payload = await payloadClient();
    const [site, settings] = await Promise.all([
      getSiteSettings(locale),
      payload.findGlobal({
        slug: "site-settings",
        ...readOptions(locale),
        depth: 0,
        select: { serviceArea: true },
      }),
    ]);

    return { ...site, serviceArea: paragraphs(settings.serviceArea) };
  },
);

/** Lexical editor state of a rich text field in the admin panel. */
export type RichTextState = SiteSetting["imprint"];

export type LegalText = {
  body: RichTextState;
  /** The first paragraph as plain text, for the page's description. */
  summary: string | null;
};

export type LegalTexts = {
  imprint: LegalText;
  privacy: LegalText;
};

const legalText = (body: RichTextState): LegalText => ({
  body,
  summary: firstParagraphText(body),
});

/** Impressum and Datenschutzerklärung from SiteSettings, "Rechtliches". */
export const getLegalTexts = cache(
  async (locale: Locale): Promise<LegalTexts> => {
    const payload = await payloadClient();
    const settings = await payload.findGlobal({
      slug: "site-settings",
      ...readOptions(locale),
      depth: 0,
      select: { imprint: true, privacy: true },
    });

    return {
      imprint: legalText(settings.imprint),
      privacy: legalText(settings.privacy),
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

/** The fields of a project document a card needs. */
type ProjectCardFields = Pick<
  Project,
  "id" | "title" | "slug" | "objectType" | "year"
> & { cover?: Project["cover"] | null };

const toProjectCard = (project: ProjectCardFields): ProjectCard => ({
  id: project.id,
  title: project.title,
  slug: project.slug,
  objectType: project.objectType,
  year: project.year,
  photo: toPhoto(project.cover),
});

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

type SlugsByLocale = Record<Locale, Map<number, string>>;

/**
 * The slug of every document in each language, by id, from the list the
 * pages' generateStaticParams use (getServices, getProjects, getOpenJobs), so lookups
 * agree with the built pages, also when an English slug is missing and the
 * German one stands in.
 */
const slugsByLocale = async (
  list: (locale: Locale) => Promise<readonly { id: number; slug: string }[]>,
): Promise<SlugsByLocale> => {
  const lists = await Promise.all(routing.locales.map((code) => list(code)));
  return Object.fromEntries(
    routing.locales.map((code, index) => [
      code,
      new Map((lists[index] ?? []).map(({ id, slug }) => [id, slug])),
    ]),
  ) as SlugsByLocale;
};

/** The slug of one document in every language; `slug` where one is missing. */
const slugsOf = (
  byLocale: SlugsByLocale,
  id: number,
  slug: string,
): Record<Locale, string> =>
  Object.fromEntries(
    routing.locales.map((code) => [code, byLocale[code].get(id) ?? slug]),
  ) as Record<Locale, string>;

const serviceSlugsByLocale = () => slugsByLocale(getServices);

/** One service by its slug in this language, or null when there is none. */
export const getService = cache(
  async (locale: Locale, slug: string): Promise<ServiceDetail | null> => {
    const match = (await getServices(locale)).find(
      (service) => service.slug === slug,
    );
    if (!match) return null;

    const payload = await payloadClient();
    const [service, { docs: projects }, serviceSlugs] = await Promise.all([
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
      projects: projects.map(toProjectCard),
      slugs: slugsOf(serviceSlugs, match.id, slug),
      meta: {
        title: service.meta?.title ?? null,
        description: service.meta?.description ?? null,
      },
    };
  },
);

export type ProjectListItem = ProjectCard & {
  /** The id of the project's service, for the filter of /referenzen. */
  serviceId: number;
};

/** All projects in the admin panel's order, with the service of each. */
export const getProjects = cache(
  async (locale: Locale): Promise<ProjectListItem[]> => {
    const payload = await payloadClient();
    const { docs } = await payload.find({
      collection: "projects",
      ...readOptions(locale),
      // depth 1 for the cover; of the service only its id is needed.
      depth: 1,
      sort: "order",
      pagination: false,
      select: {
        title: true,
        slug: true,
        service: true,
        objectType: true,
        year: true,
        cover: true,
      },
      populate: { services: { slug: true } },
    });

    return docs.map((project) => ({
      ...toProjectCard(project),
      serviceId: isPopulated(project.service)
        ? project.service.id
        : project.service,
    }));
  },
);

/** A fact of a project, "Objekt: Einfamilienhaus". */
export type ProjectFacts = {
  objectType: string;
  year: number;
  duration: string;
  material: string;
};

export type ProjectDetail = {
  id: number;
  title: string;
  facts: ProjectFacts;
  /** "Die Aufgabe", in paragraphs. */
  challenge: string[];
  /** "Unsere Lösung", in paragraphs. */
  solution: string[];
  photo: Photo | null;
  gallery: Photo[];
  /** The service the project belongs to, for the link to its page. */
  service: { title: string; slug: string } | null;
  /** The projects before and after this one in the admin panel's order. */
  previous: ProjectCard | null;
  next: ProjectCard | null;
  /** The project's slug in every language, for alternates and the language switch. */
  slugs: Record<Locale, string>;
  meta: {
    title: string | null;
    description: string | null;
  };
};

const projectSlugsByLocale = () => slugsByLocale(getProjects);

/** One project by its slug in this language, or null when there is none. */
export const getProject = cache(
  async (locale: Locale, slug: string): Promise<ProjectDetail | null> => {
    const projects = await getProjects(locale);
    const index = projects.findIndex((project) => project.slug === slug);
    const match = projects[index];
    if (!match) return null;

    const payload = await payloadClient();
    const [project, services, projectSlugs] = await Promise.all([
      payload.findByID({
        collection: "projects",
        id: match.id,
        ...readOptions(locale),
        depth: 1,
        disableErrors: true,
        select: {
          title: true,
          objectType: true,
          year: true,
          duration: true,
          material: true,
          challenge: true,
          solution: true,
          cover: true,
          gallery: true,
          meta: true,
        },
      }),
      getServices(locale),
      projectSlugsByLocale(),
    ]);
    if (!project) return null;

    const service = services.find(({ id }) => id === match.serviceId);
    const neighbour = (at: number): ProjectCard | null => {
      const item = projects[at];
      if (!item) return null;
      const { serviceId: _, ...card } = item;
      return card;
    };

    return {
      id: project.id,
      title: project.title,
      facts: {
        objectType: project.objectType,
        year: project.year,
        duration: project.duration,
        material: project.material,
      },
      challenge: paragraphs(project.challenge),
      solution: paragraphs(project.solution),
      photo: toPhoto(project.cover),
      gallery: (project.gallery ?? [])
        .map(toPhoto)
        .filter((photo): photo is Photo => photo !== null),
      service: service ? { title: service.title, slug: service.slug } : null,
      previous: neighbour(index - 1),
      next: neighbour(index + 1),
      slugs: slugsOf(projectSlugs, match.id, slug),
      meta: {
        title: project.meta?.title ?? null,
        description: project.meta?.description ?? null,
      },
    };
  },
);

export type JobListItem = {
  id: number;
  title: string;
  slug: string;
  employmentType: Job["employmentType"];
  /** "ab sofort", "September 2027". */
  start: string;
  hours: string;
  pay: JobPay;
};

/**
 * Open positions (switched on in the admin panel), in their order. A job
 * that is switched off is not on the list, has no page and no slug for the
 * language switch.
 */
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
      select: {
        title: true,
        slug: true,
        employmentType: true,
        start: true,
        hours: true,
        payMin: true,
        payMax: true,
        payUnit: true,
        payText: true,
      },
    });

    return docs.map((job) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      employmentType: job.employmentType,
      start: job.start,
      hours: job.hours,
      pay: toJobPay(job),
    }));
  },
);

export type JobDetail = Omit<JobListItem, "slug"> & {
  intro: string[];
  tasks: ListItem[];
  requirements: ListItem[];
  benefits: ListItem[];
  /** ISO dates from Payload, for the Google markup. */
  datePosted: string;
  validThrough: string | null;
  /** The job's slug in every language, for alternates and the language switch. */
  slugs: Record<Locale, string>;
  meta: {
    title: string | null;
    description: string | null;
  };
};

const jobSlugsByLocale = () => slugsByLocale(getOpenJobs);

/** One open job by its slug in this language, or null when there is none. */
export const getJob = cache(
  async (locale: Locale, slug: string): Promise<JobDetail | null> => {
    const match = (await getOpenJobs(locale)).find((job) => job.slug === slug);
    if (!match) return null;

    const payload = await payloadClient();
    const [job, jobSlugs] = await Promise.all([
      payload.findByID({
        collection: "jobs",
        id: match.id,
        ...readOptions(locale),
        depth: 0,
        disableErrors: true,
        select: {
          title: true,
          employmentType: true,
          start: true,
          hours: true,
          payMin: true,
          payMax: true,
          payUnit: true,
          payText: true,
          intro: true,
          tasks: true,
          requirements: true,
          benefits: true,
          datePosted: true,
          validThrough: true,
          meta: true,
        },
      }),
      jobSlugsByLocale(),
    ]);
    if (!job) return null;

    return {
      id: job.id,
      title: job.title,
      employmentType: job.employmentType,
      start: job.start,
      hours: job.hours,
      pay: toJobPay(job),
      intro: paragraphs(job.intro),
      tasks: listItems(job.tasks),
      requirements: listItems(job.requirements),
      benefits: listItems(job.benefits),
      datePosted: job.datePosted,
      validThrough: job.validThrough ?? null,
      slugs: slugsOf(jobSlugs, match.id, slug),
      meta: {
        title: job.meta?.title ?? null,
        description: job.meta?.description ?? null,
      },
    };
  },
);

/** This language's slug → the slug in each other language. */
const slugTranslationsFor = (
  locale: Locale,
  byLocale: SlugsByLocale,
): Partial<Record<Locale, Record<string, string>>> =>
  Object.fromEntries(
    routing.locales
      .filter((code) => code !== locale)
      .map((code) => [
        code,
        Object.fromEntries(
          [...byLocale[locale]].map(([id, slug]) => [
            slug,
            byLocale[code].get(id) ?? slug,
          ]),
        ),
      ]),
  );

/**
 * For the language switch in the header: on pages whose slug is
 * translated, the slug of this language → the slug in each other language.
 */
export const getSlugTranslations = cache(
  async (locale: Locale): Promise<SlugTranslations> => {
    const [services, projects, jobs] = await Promise.all([
      serviceSlugsByLocale(),
      projectSlugsByLocale(),
      jobSlugsByLocale(),
    ]);

    return {
      "/leistungen/[slug]": slugTranslationsFor(locale, services),
      "/referenzen/[slug]": slugTranslationsFor(locale, projects),
      "/karriere/[slug]": slugTranslationsFor(locale, jobs),
    };
  },
);

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  /** The year the person joined the workshop. */
  since: number;
};

/** The team in the admin panel's order. */
export const getTeam = cache(async (locale: Locale): Promise<TeamMember[]> => {
  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: "team",
    ...readOptions(locale),
    depth: 0,
    sort: "order",
    pagination: false,
    select: { name: true, role: true, since: true },
  });

  return docs.map(({ id, name, role, since }) => ({ id, name, role, since }));
});

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

/** A step of the 3D scene, from its caption in the admin panel. */
export type SceneStepItem = SceneStep & { id: string };

/** A line under the first screen: "<strong>Meisterbetrieb</strong> seit 1989". */
export type HeroFact = {
  id: string;
  highlight: string;
  text: string;
};

/** A project of "Ausgewählte Projekte", with how long it took. */
export type FeaturedProject = ProjectCard & {
  /** "9 Wochen" */
  duration: string;
};

/** A principle of "Über uns" or a question of "Karriere": a heading and its text. */
export type TitledText = {
  id: string;
  title: string;
  text: string;
};

export type AboutBlock = {
  title: string;
  paragraphs: string[];
  photo: Photo | null;
  /** "So arbeiten wir": up to three, none when the admin panel has none. */
  principles: TitledText[];
};

export type CareersBlock = {
  title: string;
  paragraphs: string[];
  photo: Photo | null;
  /** Why it is good to work here: up to four lines. */
  benefits: ListItem[];
  /** Questions (title) and answers (text). */
  faq: TitledText[];
};

export type HomeContent = {
  hero: {
    title: string;
    text: string;
    photo: Photo | null;
    facts: HeroFact[];
  };
  featuredProjects: FeaturedProject[];
  processSteps: ProcessStep[];
  sceneSteps: SceneStepItem[];
  about: AboutBlock;
  careers: CareersBlock;
  meta: {
    title: string | null;
    description: string | null;
  };
};

const rowId = (id: string | null | undefined, index: number): string =>
  id ?? String(index);

/**
 * The HomePage global with its photos and the three chosen projects. Its
 * "Über uns" and "Karriere" blocks also fill the about and careers pages.
 */
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
          duration: true,
          cover: true,
        },
      },
    });

    return {
      hero: {
        title: home.hero.title,
        text: home.hero.text,
        photo: toPhoto(home.hero.image),
        facts: (home.hero.facts ?? []).map((fact, index) => ({
          id: rowId(fact.id, index),
          highlight: fact.highlight,
          text: fact.text,
        })),
      },
      featuredProjects: populated(home.featuredProjects).map((project) => ({
        ...toProjectCard(project),
        duration: project.duration,
      })),
      processSteps: (home.processSteps ?? []).map((step, index) => ({
        id: rowId(step.id, index),
        title: step.title,
        text: step.text,
      })),
      sceneSteps: (home.sceneCaptions ?? []).map((caption, index) => ({
        id: rowId(caption.id, index),
        ...sceneStep(caption.text),
      })),
      about: {
        title: home.about.title,
        paragraphs: paragraphs(home.about.text),
        photo: toPhoto(home.about.image),
        principles: (home.about.principles ?? []).map((principle, index) => ({
          id: rowId(principle.id, index),
          title: principle.title,
          text: principle.text,
        })),
      },
      careers: {
        title: home.careers.title,
        paragraphs: paragraphs(home.careers.text),
        photo: toPhoto(home.careers.image),
        benefits: listItems(home.careers.benefits),
        faq: (home.careers.faq ?? []).map((entry, index) => ({
          id: rowId(entry.id, index),
          title: entry.question,
          text: entry.answer,
        })),
      },
      meta: {
        title: home.meta?.title ?? null,
        description: home.meta?.description ?? null,
      },
    };
  },
);
