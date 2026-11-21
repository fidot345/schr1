import type { AboutTeaserContent } from "@/components/home/AboutTeaser";
import type { ContactContent } from "@/components/home/Contact";
import type { HeroContent } from "@/components/home/Hero";
import type { JobsContent } from "@/components/home/Jobs";
import type { ProcessContent } from "@/components/home/Process";
import type { ProjectsContent } from "@/components/home/Projects";
import type { ServicesContent } from "@/components/home/Services";
import type { TestimonialsContent } from "@/components/home/Testimonials";
import type { WardrobeContent } from "@/components/home/WardrobeSection";
import type { Locale } from "@/i18n/routing";

/*
 * TEMP(stage-3): данные из Payload; на этапе 2 эти тексты уйдут в seed.
 * The texts of the home page from the mockup (design/01-startseite-desktop.html),
 * in German and English, while the redesign takes no data from Payload
 * (docs/REDESIGN.md, rule 6). The types are those of the section props.
 * Section titles and button labels are not here: they live in messages/*.json.
 * The slugs are the ones of seed/data.ts, per language. The phone, e-mail and
 * address of the contact block come from demo-site.ts, not from here.
 */

export type DemoHome = {
  hero: HeroContent;
  services: ServicesContent;
  scene: WardrobeContent;
  projects: ProjectsContent;
  process: ProcessContent;
  jobs: JobsContent;
  about: AboutTeaserContent;
  testimonials: TestimonialsContent;
  contact: ContactContent;
};

const DEMO_HOME: Record<Locale, DemoHome> = {
  de: {
    hero: {
      title: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
      text: "Küchen, Einbauschränke, Türen und Innenausbau – geplant, gebaut und montiert von unserem Team.",
      photo: {
        tone: "shop",
        alt: "Platzhalter für ein Foto der Werkstatt",
        caption: "Foto: Werkstatt mit Hobelbank, Tageslicht von der Seite",
      },
      facts: [
        { strong: "Meisterbetrieb", rest: "seit 1989" },
        { strong: "Neun Leute", rest: "in der eigenen Werkstatt" },
        { strong: "Montage", rest: "im Umkreis von 40 km" },
      ],
    },
    services: {
      intro:
        "Alles entsteht in unserer Werkstatt und wird von unserem eigenen Team eingebaut.",
      items: [
        {
          id: "kuechen",
          title: "Küchen nach Maß",
          text: "Geplant für Ihren Raum, gebaut in unserer Werkstatt.",
          photo: {
            tone: "oak",
            alt: "Platzhalter für ein Foto einer Küche",
            caption: "Foto: Wohnküche in Eiche",
          },
          href: { pathname: "/leistungen/[slug]", params: { slug: "kuechen" } },
        },
        {
          id: "schraenke",
          title: "Schränke & Möbel",
          text: "Einbauschränke, Garderoben und Regale – auch unter der Dachschräge.",
          photo: {
            tone: "birch",
            alt: "Platzhalter für ein Foto eines Einbauschranks",
            caption: "Foto: Schrank unter der Dachschräge",
          },
          href: {
            pathname: "/leistungen/[slug]",
            params: { slug: "schraenke-und-moebel" },
          },
        },
        {
          id: "tueren",
          title: "Innentüren",
          text: "Holztüren nach Maß, auch für Altbauten mit schiefen Wänden.",
          photo: {
            tone: "walnut",
            alt: "Platzhalter für ein Foto einer Innentür",
            caption: "Foto: Innentür im Altbau",
          },
          href: { pathname: "/leistungen/[slug]", params: { slug: "tueren" } },
        },
        {
          id: "innenausbau",
          title: "Innenausbau",
          text: "Wand- und Deckenverkleidungen, Nischen und Einbauten.",
          photo: {
            tone: "shop",
            alt: "Platzhalter für ein Foto einer Wandverkleidung",
            caption: "Foto: Wandverkleidung mit Nische",
          },
          href: {
            pathname: "/leistungen/[slug]",
            params: { slug: "innenausbau" },
          },
        },
      ],
    },
    scene: {
      intro: "So entsteht ein Einbauschrank bei uns – Schritt für Schritt.",
      steps: [
        {
          title: "Zuschnitt",
          text: "Jedes Teil wird in unserer Werkstatt millimetergenau zugeschnitten.",
        },
        {
          title: "Korpus",
          text: "Seiten, Boden und Deckel werden verleimt und verschraubt.",
        },
        {
          title: "Innenleben",
          text: "Rückwand, Fachböden und Kleiderstange kommen hinein.",
        },
        {
          title: "Fronten",
          text: "Die Türen werden eingepasst und ausgerichtet.",
        },
        {
          title: "Montage",
          text: "Wir bauen bei Ihnen ein – sauber und pünktlich.",
        },
        {
          title: "Fertig",
          text: "Vom Aufmaß bis zur Montage in 8–10 Wochen.",
        },
      ],
    },
    projects: {
      featured: {
        id: "wohnkueche",
        title: "Wohnküche in Eiche",
        meta: "Einfamilienhaus, 2025, 9 Wochen",
        photo: {
          tone: "oak",
          alt: "Platzhalter für ein Foto der Wohnküche",
          caption: "Foto: Küche mit Kochinsel, Fronten aus Eiche",
        },
        href: {
          pathname: "/referenzen/[slug]",
          params: { slug: "wohnkueche-in-eiche" },
        },
      },
      more: [
        {
          id: "dachschraege",
          title: "Einbauschrank unter der Dachschräge",
          meta: "Dachgeschosswohnung, 2025, 6 Wochen",
          photo: {
            tone: "birch",
            alt: "Platzhalter für ein Foto des Einbauschranks",
            caption: "Foto: Schrank unter der Dachschräge",
          },
          href: {
            pathname: "/referenzen/[slug]",
            params: { slug: "einbauschrank-unter-der-dachschraege" },
          },
        },
        {
          id: "buecherwand",
          title: "Bücherwand im Wohnzimmer",
          meta: "Einfamilienhaus, 2023, 7 Wochen",
          photo: {
            tone: "walnut",
            alt: "Platzhalter für ein Foto der Bücherwand",
            caption: "Foto: Bücherwand im Wohnzimmer",
          },
          href: {
            pathname: "/referenzen/[slug]",
            params: { slug: "buecherwand-im-wohnzimmer" },
          },
        },
      ],
    },
    process: {
      steps: [
        {
          title: "Aufmaß vor Ort",
          text: "Wir kommen zu Ihnen, messen aus und hören zu, was Sie brauchen.",
        },
        {
          title: "Entwurf und Angebot",
          text: "Sie bekommen eine Zeichnung und ein schriftliches Angebot.",
        },
        {
          title: "Fertigung in der Werkstatt",
          text: "Jedes Teil entsteht bei uns in Wendelfing.",
        },
        {
          title: "Montage",
          text: "Wir bauen ein, räumen auf und nehmen die Verpackung mit.",
        },
      ],
      note: "Vom Aufmaß bis zur Montage vergehen meist 8 bis 10 Wochen.",
    },
    jobs: {
      intro:
        "Neun Leute, eine Werkstatt, feste Zeiten. Freitags ist um 12 Uhr Schluss.",
      photo: {
        tone: "shop",
        alt: "Platzhalter für ein Foto eines Azubis an der Hobelbank",
        caption: "Foto: Azubi an der Hobelbank, Hände und Werkstück",
      },
      jobs: [
        {
          id: "schreiner",
          title: "Schreiner (m/w/d)",
          meta: "Vollzeit, ab sofort, 19–23 € pro Stunde",
          href: { pathname: "/karriere/[slug]", params: { slug: "schreiner" } },
        },
        {
          id: "monteur",
          title: "Monteur für Möbel und Küchen (m/w/d)",
          meta: "Vollzeit, ab sofort, 18–21 € pro Stunde",
          href: { pathname: "/karriere/[slug]", params: { slug: "monteur" } },
        },
        {
          id: "ausbildung",
          title: "Ausbildung zum Schreiner (m/w/d)",
          meta: "Start September 2027, 900–1.100 € im Monat",
          href: {
            pathname: "/karriere/[slug]",
            params: { slug: "ausbildung-schreiner" },
          },
        },
      ],
    },
    about: {
      paragraphs: [
        "Georg Tannrieder hat die Werkstatt 1989 in Wendelfing gegründet. Heute führt sein Sohn Johannes den Betrieb als Schreinermeister.",
        "Wir sind neun Leute: Schreinerinnen und Schreiner, ein Monteur, zwei Azubis und Anna im Büro. Was wir bauen, montieren wir selbst.",
      ],
      photo: {
        tone: "walnut",
        alt: "Platzhalter für ein Foto des Maschinenraums",
        caption: "Foto: Maschinenraum der Werkstatt",
      },
    },
    testimonials: {
      items: [
        {
          id: "kueche",
          quote:
            "Die Küche passt auf den Zentimeter, auch an der schiefen Wand. Alle Termine wurden eingehalten.",
          author: "Familie K., Einfamilienhaus",
        },
        {
          id: "schrank",
          quote:
            "Der Schrank unter der Dachschräge nutzt jeden Winkel. Montage an einem Tag, alles sauber.",
          author: "Frau M., Dachgeschosswohnung",
        },
        {
          id: "tueren",
          quote:
            "Zwölf neue Türen für unseren Altbau, und keine sieht aus wie von der Stange.",
          author: "Familie S., Altbau",
        },
      ],
    },
    contact: {
      intro:
        "Rufen Sie an oder schicken Sie uns eine Anfrage. Wir melden uns innerhalb von zwei Werktagen.",
      hours: [
        {
          id: "weekdays",
          days: "Montag bis Donnerstag",
          hours: "7:00–16:30 Uhr",
        },
        { id: "friday", days: "Freitag", hours: "7:00–12:00 Uhr" },
        {
          id: "weekend",
          days: "Samstag und Sonntag",
          hours: "geschlossen",
          closed: true,
        },
      ],
      note: "Wir arbeiten im Umkreis von etwa 40 km um Wendelfing.",
    },
  },
  en: {
    hero: {
      title: "Made-to-measure furniture from our workshop in Wendelfing",
      text: "Kitchens, built-in wardrobes, doors and interior fit-out – planned, built and installed by our team.",
      photo: {
        tone: "shop",
        alt: "Placeholder for a photo of the workshop",
        caption: "Photo: workshop with a workbench, daylight from the side",
      },
      facts: [
        { strong: "Master craftsman's workshop", rest: "since 1989" },
        { strong: "Nine people", rest: "in our own workshop" },
        { strong: "Installation", rest: "within 40 km" },
      ],
    },
    services: {
      intro:
        "Everything is made in our workshop and installed by our own team.",
      items: [
        {
          id: "kuechen",
          title: "Made-to-measure kitchens",
          text: "Planned for your room, built in our workshop.",
          photo: {
            tone: "oak",
            alt: "Placeholder for a photo of a kitchen",
            caption: "Photo: open-plan kitchen in oak",
          },
          href: {
            pathname: "/leistungen/[slug]",
            params: { slug: "kitchens" },
          },
        },
        {
          id: "schraenke",
          title: "Cabinets & furniture",
          text: "Built-in wardrobes, hallway units and shelves – also under sloping roofs.",
          photo: {
            tone: "birch",
            alt: "Placeholder for a photo of a built-in wardrobe",
            caption: "Photo: wardrobe under the sloping roof",
          },
          href: {
            pathname: "/leistungen/[slug]",
            params: { slug: "cabinets-and-furniture" },
          },
        },
        {
          id: "tueren",
          title: "Interior doors",
          text: "Wooden doors made to measure, also for old buildings with crooked walls.",
          photo: {
            tone: "walnut",
            alt: "Placeholder for a photo of an interior door",
            caption: "Photo: interior door in an old building",
          },
          href: { pathname: "/leistungen/[slug]", params: { slug: "doors" } },
        },
        {
          id: "innenausbau",
          title: "Interior fit-out",
          text: "Wall and ceiling cladding, niches and built-in units.",
          photo: {
            tone: "shop",
            alt: "Placeholder for a photo of wall cladding",
            caption: "Photo: wall cladding with a niche",
          },
          href: {
            pathname: "/leistungen/[slug]",
            params: { slug: "interior-fit-out" },
          },
        },
      ],
    },
    scene: {
      intro: "This is how a built-in wardrobe is made here – step by step.",
      steps: [
        {
          title: "Cutting",
          text: "Every part is cut to the millimetre in our workshop.",
        },
        {
          title: "Carcass",
          text: "Sides, base and top are glued and screwed together.",
        },
        {
          title: "Interior",
          text: "Back panel, shelves and hanging rail go in.",
        },
        {
          title: "Doors",
          text: "The doors are fitted and aligned.",
        },
        {
          title: "Installation",
          text: "We fit it in your home – clean and on time.",
        },
        {
          title: "Done",
          text: "From measuring to installation in 8–10 weeks.",
        },
      ],
    },
    projects: {
      featured: {
        id: "wohnkueche",
        title: "Open-plan kitchen in oak",
        meta: "Detached house, 2025, 9 weeks",
        photo: {
          tone: "oak",
          alt: "Placeholder for a photo of the open-plan kitchen",
          caption: "Photo: kitchen with an island, oak fronts",
        },
        href: {
          pathname: "/referenzen/[slug]",
          params: { slug: "open-plan-kitchen-in-oak" },
        },
      },
      more: [
        {
          id: "dachschraege",
          title: "Built-in wardrobe under the eaves",
          meta: "Attic flat, 2025, 6 weeks",
          photo: {
            tone: "birch",
            alt: "Placeholder for a photo of the built-in wardrobe",
            caption: "Photo: wardrobe under the sloping roof",
          },
          href: {
            pathname: "/referenzen/[slug]",
            params: { slug: "built-in-wardrobe-under-the-eaves" },
          },
        },
        {
          id: "buecherwand",
          title: "Bookcase wall in the living room",
          meta: "Detached house, 2023, 7 weeks",
          photo: {
            tone: "walnut",
            alt: "Placeholder for a photo of the bookcase wall",
            caption: "Photo: bookcase wall in the living room",
          },
          href: {
            pathname: "/referenzen/[slug]",
            params: { slug: "bookcase-wall-in-the-living-room" },
          },
        },
      ],
    },
    process: {
      steps: [
        {
          title: "Measuring on site",
          text: "We come to you, measure up and listen to what you need.",
        },
        {
          title: "Design and quote",
          text: "You get a drawing and a written quote.",
        },
        {
          title: "Made in the workshop",
          text: "Every part is made here in Wendelfing.",
        },
        {
          title: "Installation",
          text: "We fit it, tidy up and take the packaging with us.",
        },
      ],
      note: "From measuring to installation usually takes 8 to 10 weeks.",
    },
    jobs: {
      intro:
        "Nine people, one workshop, fixed hours. On Fridays we finish at 12.",
      photo: {
        tone: "shop",
        alt: "Placeholder for a photo of an apprentice at the workbench",
        caption: "Photo: apprentice at the workbench, hands and workpiece",
      },
      jobs: [
        {
          id: "schreiner",
          title: "Joiner (m/f/d)",
          meta: "Full-time, from now, €19–23 per hour",
          href: { pathname: "/karriere/[slug]", params: { slug: "joiner" } },
        },
        {
          id: "monteur",
          title: "Furniture and kitchen fitter (m/f/d)",
          meta: "Full-time, from now, €18–21 per hour",
          href: { pathname: "/karriere/[slug]", params: { slug: "fitter" } },
        },
        {
          id: "ausbildung",
          title: "Apprenticeship as a joiner (m/f/d)",
          meta: "Starts September 2027, €900–1,100 per month",
          href: {
            pathname: "/karriere/[slug]",
            params: { slug: "apprenticeship-joiner" },
          },
        },
      ],
    },
    about: {
      paragraphs: [
        "Georg Tannrieder founded the workshop in Wendelfing in 1989. Today his son Johannes runs the business as a master joiner.",
        "There are nine of us: joiners, a fitter, two apprentices and Anna in the office. What we build, we install ourselves.",
      ],
      photo: {
        tone: "walnut",
        alt: "Placeholder for a photo of the machine room",
        caption: "Photo: the machine room of the workshop",
      },
    },
    testimonials: {
      items: [
        {
          id: "kueche",
          quote:
            "The kitchen fits to the centimetre, even on the crooked wall. All appointments were kept.",
          author: "The K. family, detached house",
        },
        {
          id: "schrank",
          quote:
            "The wardrobe under the sloping roof uses every corner. Installed in one day, everything clean.",
          author: "Ms M., attic flat",
        },
        {
          id: "tueren",
          quote:
            "Twelve new doors for our old building, and not one looks off the peg.",
          author: "The S. family, period building",
        },
      ],
    },
    contact: {
      intro:
        "Give us a call or send us a request. We get back to you within two working days.",
      hours: [
        {
          id: "weekdays",
          days: "Monday to Thursday",
          hours: "7:00–16:30",
        },
        { id: "friday", days: "Friday", hours: "7:00–12:00" },
        {
          id: "weekend",
          days: "Saturday and Sunday",
          hours: "closed",
          closed: true,
        },
      ],
      note: "We work within about 40 km of Wendelfing.",
    },
  },
};

export const getDemoHome = (locale: Locale): DemoHome => DEMO_HOME[locale];
