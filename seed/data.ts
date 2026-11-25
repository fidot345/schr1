/*
 * Demo content of the fictional Schreinerei Tannrieder, BRIEF.md section 2.
 * German first, English second. Slugs follow the addresses in the brief.
 */

import type { Job } from "../src/payload-types";
import { type RichText, richText } from "./lexical";

export const PHOTOS = [
  "hero-1.jpg",
  "service-kueche.jpg",
  "service-schrank.jpg",
  "service-tueren.jpg",
  "service-ausbau.jpg",
  "projekt-wohnkueche.jpg",
  "projekt-dachschraege.jpg",
  "projekt-garderobe.jpg",
  "projekt-altbau-tueren.jpg",
  "projekt-buecherwand.jpg",
  "projekt-badmoebel.jpg",
  "about-werkstatt.jpg",
  "karriere.jpg",
] as const;

export type PhotoFile = (typeof PHOTOS)[number];

export type Localized<T> = { de: T; en: T };

export type ServiceSeed = {
  cover: PhotoFile;
  gallery: PhotoFile[];
  order: number;
  text: Localized<{
    title: string;
    slug: string;
    summary: string;
    intro: string;
    included: string[];
    materials: string[];
    duration: string;
  }>;
};

export type ProjectSeed = {
  /** German slug of the service. */
  service: string;
  year: number;
  cover: PhotoFile;
  gallery: PhotoFile[];
  order: number;
  text: Localized<{
    title: string;
    slug: string;
    objectType: string;
    duration: string;
    material: string;
    challenge: string;
    solution: string;
  }>;
};

export type JobSeed = {
  employmentType: Job["employmentType"];
  payMin?: number;
  payMax?: number;
  payUnit?: NonNullable<Job["payUnit"]>;
  datePosted: string;
  order: number;
  text: Localized<{
    title: string;
    slug: string;
    start: string;
    hours: string;
    payText?: string;
    intro: string;
    tasks: string[];
    requirements: string[];
    benefits: string[];
  }>;
};

export type TeamSeed = {
  name: string;
  since: number;
  order: number;
  role: Localized<string>;
};

export type TestimonialSeed = {
  /** German slug of the project. */
  project: string;
  order: number;
  text: Localized<{ quote: string; author: string }>;
};

export const services: ServiceSeed[] = [
  {
    cover: "service-kueche.jpg",
    gallery: ["projekt-wohnkueche.jpg"],
    order: 1,
    text: {
      de: {
        title: "Küchen",
        slug: "kuechen",
        summary:
          "Ihre Küche nach Maß: vom Aufmaß bis zur Montage in 8–10 Wochen.",
        intro:
          "Wir planen Ihre Küche für Ihren Raum, nicht für ein Katalogmaß. Korpusse, Fronten und Arbeitsplatte entstehen in unserer Werkstatt in Wendelfing, eingebaut wird von unserem eigenen Team. Spüle und Geräte wählen Sie mit uns zusammen aus, wir bauen sie passend ein.",
        included: [
          "Aufmaß und Beratung bei Ihnen vor Ort",
          "Planung mit Grundriss und Ansichten",
          "Fertigung von Korpussen, Fronten und Arbeitsplatte in unserer Werkstatt",
          "Einbau von Spüle und Elektrogeräten",
          "Montage durch unser Team, abgestimmt mit Elektriker und Installateur",
        ],
        materials: [
          "Massivholz und Furnier: Eiche, Esche, Buche",
          "Lackierte Fronten in jeder RAL-Farbe",
          "Arbeitsplatten aus Holz, Naturstein oder Keramik",
          "Beschläge mit Dämpfung für Türen und Auszüge",
        ],
        duration: "8–10 Wochen vom Aufmaß bis zur Montage",
      },
      en: {
        title: "Kitchens",
        slug: "kitchens",
        summary:
          "Your made-to-measure kitchen: from measuring to installation in 8–10 weeks.",
        intro:
          "We plan your kitchen for your room, not for a catalogue size. Carcasses, fronts and worktop are made in our workshop in Wendelfing and installed by our own team. You choose the sink and appliances with us, and we build them in to fit.",
        included: [
          "Measuring and advice at your home",
          "Plans with floor layout and elevations",
          "Carcasses, fronts and worktop made in our workshop",
          "Fitting the sink and electrical appliances",
          "Installation by our team, coordinated with your electrician and plumber",
        ],
        materials: [
          "Solid wood and veneer: oak, ash, beech",
          "Lacquered fronts in any RAL colour",
          "Worktops in wood, natural stone or ceramic",
          "Soft-close fittings for doors and drawers",
        ],
        duration: "8–10 weeks from measuring to installation",
      },
    },
  },
  {
    cover: "service-schrank.jpg",
    gallery: [
      "projekt-dachschraege.jpg",
      "projekt-garderobe.jpg",
      "projekt-badmoebel.jpg",
    ],
    order: 2,
    text: {
      de: {
        title: "Schränke & Möbel",
        slug: "schraenke-und-moebel",
        summary:
          "Einbauschränke, Garderoben und Möbel, die genau in Ihren Raum passen.",
        intro:
          "Unter der Dachschräge, in der Nische neben dem Kamin oder im schmalen Flur: Wir bauen Schränke und Möbel auf den Millimeter genau für den Platz, den Sie haben. Innenaufteilung, Griffe und Oberflächen legen wir gemeinsam mit Ihnen fest.",
        included: [
          "Aufmaß bei Ihnen vor Ort",
          "Entwurf mit Innenaufteilung",
          "Fertigung in unserer Werkstatt",
          "Lieferung und Montage",
          "Anpassung an Wände und Decken, die nicht gerade sind",
        ],
        materials: [
          "Massivholz: Eiche, Esche, Kiefer",
          "Furnierte und lackierte Platten",
          "Multiplex mit sichtbarer Kante",
          "Beschläge mit Dämpfung",
        ],
        duration: "4–8 Wochen, je nach Größe",
      },
      en: {
        title: "Cabinets & furniture",
        slug: "cabinets-and-furniture",
        summary:
          "Built-in wardrobes, hallway units and furniture made to fit your room exactly.",
        intro:
          "Under the sloping ceiling, in the alcove next to the fireplace or in a narrow hallway: we build cabinets and furniture to the millimetre for the space you have. Interior layout, handles and finishes are decided together with you.",
        included: [
          "Measuring at your home",
          "Design including the interior layout",
          "Made in our workshop",
          "Delivery and installation",
          "Fitted to walls and ceilings that are not straight",
        ],
        materials: [
          "Solid wood: oak, ash, pine",
          "Veneered and lacquered panels",
          "Plywood with a visible edge",
          "Soft-close fittings",
        ],
        duration: "4–8 weeks, depending on size",
      },
    },
  },
  {
    cover: "service-tueren.jpg",
    gallery: ["projekt-altbau-tueren.jpg"],
    order: 3,
    text: {
      de: {
        title: "Türen",
        slug: "tueren",
        summary:
          "Innentüren nach Maß – auch für alte Häuser, in denen kein Maß dem anderen gleicht.",
        intro:
          "Wir fertigen Innentüren samt Zarge für Neubau und Altbau. Wo Standardmaße nicht passen, bauen wir die Tür passend zur Öffnung. Alte Türen bauen wir auf Wunsch nach, damit das Haus sein Gesicht behält.",
        included: [
          "Aufmaß jeder Türöffnung",
          "Türblatt und Zarge nach Maß",
          "Beschläge, Schlösser und Drücker",
          "Einbau und Einstellen vor Ort",
          "Nachbau historischer Türen nach Vorlage",
        ],
        materials: [
          "Massivholz und Furnier",
          "Lackierte Oberflächen",
          "Glasfüllungen aus Klarglas oder satiniertem Glas",
          "Beschläge aus Edelstahl oder Messing",
        ],
        duration: "6–8 Wochen",
      },
      en: {
        title: "Doors",
        slug: "doors",
        summary:
          "Made-to-measure interior doors – also for old houses where no two openings are alike.",
        intro:
          "We make interior doors with frames for new and old buildings. Where standard sizes do not fit, we build the door to suit the opening. On request we reproduce old doors so the house keeps its character.",
        included: [
          "Measuring every door opening",
          "Door leaf and frame made to measure",
          "Hinges, locks and handles",
          "Fitting and adjusting on site",
          "Reproduction of period doors from an original",
        ],
        materials: [
          "Solid wood and veneer",
          "Lacquered finishes",
          "Glass panels in clear or frosted glass",
          "Fittings in stainless steel or brass",
        ],
        duration: "6–8 weeks",
      },
    },
  },
  {
    cover: "service-ausbau.jpg",
    gallery: ["projekt-buecherwand.jpg"],
    order: 4,
    text: {
      de: {
        title: "Innenausbau",
        slug: "innenausbau",
        summary:
          "Wand- und Deckenverkleidungen, Einbauregale und Nischen aus Holz.",
        intro:
          "Wir verkleiden Wände und Decken mit Holz, bauen Regale in Nischen ein und machen aus ungenutzten Ecken Stauraum. Licht und Steckdosen planen wir von Anfang an mit ein.",
        included: [
          "Aufmaß und Planung",
          "Wand- und Deckenverkleidungen",
          "Einbauregale und Nischen",
          "Ausschnitte für Licht, Steckdosen und Lüftung",
          "Montage und Abschlussarbeiten",
        ],
        materials: [
          "Profilholz aus Fichte, Lärche oder Eiche",
          "Furnierte Paneele",
          "Lackierte Platten",
          "Akustikpaneele aus Holz",
        ],
        duration: "4–8 Wochen, je nach Umfang",
      },
      en: {
        title: "Interior fit-out",
        slug: "interior-fit-out",
        summary:
          "Wall and ceiling panelling, built-in shelving and alcoves in wood.",
        intro:
          "We panel walls and ceilings in wood, build shelving into alcoves and turn unused corners into storage. Lighting and sockets are part of the plan from the start.",
        included: [
          "Measuring and planning",
          "Wall and ceiling panelling",
          "Built-in shelving and alcoves",
          "Cut-outs for lights, sockets and ventilation",
          "Installation and finishing work",
        ],
        materials: [
          "Timber cladding in spruce, larch or oak",
          "Veneered panels",
          "Lacquered boards",
          "Wooden acoustic panels",
        ],
        duration: "4–8 weeks, depending on scope",
      },
    },
  },
];

export const projects: ProjectSeed[] = [
  {
    service: "kuechen",
    year: 2025,
    cover: "projekt-wohnkueche.jpg",
    gallery: [],
    order: 1,
    text: {
      de: {
        title: "Wohnküche in Eiche",
        slug: "wohnkueche-in-eiche",
        objectType: "Einfamilienhaus",
        duration: "9 Wochen",
        material: "Eiche, geölt",
        challenge:
          "Küche und Esszimmer sollten ein heller, gemeinsamer Raum werden. Die Familie wollte viel Stauraum, aber keine Oberschränke, die den Raum eng machen.",
        solution:
          "Wir haben eine Schrankwand bis unter die Decke gebaut, mit Hochschränken für Geräte und Vorräte. Die Fronten aus geölter Eiche laufen bis zum Essplatz weiter, so gehören Küche und Wohnraum zusammen.",
      },
      en: {
        title: "Open-plan kitchen in oak",
        slug: "open-plan-kitchen-in-oak",
        objectType: "Detached house",
        duration: "9 weeks",
        material: "Oiled oak",
        challenge:
          "Kitchen and dining room were to become one bright shared space. The family wanted plenty of storage, but no wall cabinets that would make the room feel cramped.",
        solution:
          "We built a floor-to-ceiling wall of cabinets with tall units for appliances and supplies. The oiled oak fronts continue to the dining area, so kitchen and living space belong together.",
      },
    },
  },
  {
    service: "schraenke-und-moebel",
    year: 2025,
    cover: "projekt-dachschraege.jpg",
    gallery: [],
    order: 2,
    text: {
      de: {
        title: "Einbauschrank unter der Dachschräge",
        slug: "einbauschrank-unter-der-dachschraege",
        objectType: "Dachgeschosswohnung",
        duration: "6 Wochen",
        material: "Weiß lackiertes MDF",
        challenge:
          "Unter der Dachschräge lag ein schmaler Raum, in den kein fertiger Schrank passte. Er sollte zum Ankleidezimmer werden, mit Platz für Kleidung, Schuhe und einen Schminktisch.",
        solution:
          "Wir haben Regale und Schubladen Wand für Wand in die Schräge eingepasst. Auf der niedrigen Seite liegen die Schubladen, unter dem Dachfenster steht der Schminktisch.",
      },
      en: {
        title: "Built-in wardrobe under the eaves",
        slug: "built-in-wardrobe-under-the-eaves",
        objectType: "Attic flat",
        duration: "6 weeks",
        material: "White lacquered MDF",
        challenge:
          "Under the sloping roof there was a narrow room that no ready-made wardrobe would fit. It was to become a dressing room with space for clothes, shoes and a dressing table.",
        solution:
          "We fitted shelves and drawers into the slope, wall by wall. The drawers sit on the low side, and the dressing table stands under the roof window.",
      },
    },
  },
  {
    service: "schraenke-und-moebel",
    year: 2024,
    cover: "projekt-garderobe.jpg",
    gallery: [],
    order: 3,
    text: {
      de: {
        title: "Garderobe mit Sitzbank",
        slug: "garderobe-mit-sitzbank",
        objectType: "Reihenhaus",
        duration: "4 Wochen",
        material: "Eiche massiv",
        challenge:
          "Im Flur landeten Jacken, Schuhe und Taschen auf dem Boden. Der Flur ist schmal, eine tiefe Garderobe hätte den Weg versperrt.",
        solution:
          "Eine flache Sitzbank aus Eichenlatten mit Platz für Schuhe darunter, darüber Haken und eine Ablage. Die Einfassungen der Türen haben wir aus demselben Holz gebaut.",
      },
      en: {
        title: "Hallway unit with bench",
        slug: "hallway-unit-with-bench",
        objectType: "Terraced house",
        duration: "4 weeks",
        material: "Solid oak",
        challenge:
          "Coats, shoes and bags kept ending up on the hallway floor. The hallway is narrow, and a deep unit would have blocked the way.",
        solution:
          "A shallow bench made of oak slats with room for shoes underneath, and hooks and a shelf above. We made the door trims from the same wood.",
      },
    },
  },
  {
    service: "tueren",
    year: 2024,
    cover: "projekt-altbau-tueren.jpg",
    gallery: [],
    order: 4,
    text: {
      de: {
        title: "Innentüren für einen Altbau",
        slug: "innentueren-fuer-einen-altbau",
        objectType: "Altbau",
        duration: "8 Wochen",
        material: "Lackiertes Holz mit Glasfüllungen",
        challenge:
          "In einem Altbau mit hohen Decken sollten zwölf Innentüren erneuert werden. Keine Öffnung hatte dasselbe Maß, und die neuen Türen sollten aussehen, als wären sie schon immer da gewesen.",
        solution:
          "Wir haben jede Öffnung einzeln aufgemessen und die Türen nach dem Vorbild der alten mit Füllungen und Glas gebaut. Zum Wohnzimmer hin sind es Flügeltüren, damit der lange Flur hell bleibt.",
      },
      en: {
        title: "Interior doors for an old building",
        slug: "interior-doors-for-an-old-building",
        objectType: "Period building",
        duration: "8 weeks",
        material: "Lacquered wood with glass panels",
        challenge:
          "Twelve interior doors in an old building with high ceilings needed replacing. No two openings were the same size, and the new doors were to look as if they had always been there.",
        solution:
          "We measured every opening separately and built the doors with panels and glass, modelled on the old ones. Double doors lead to the living room so the long hallway stays bright.",
      },
    },
  },
  {
    service: "innenausbau",
    year: 2023,
    cover: "projekt-buecherwand.jpg",
    gallery: [],
    order: 5,
    text: {
      de: {
        title: "Bücherwand im Wohnzimmer",
        slug: "buecherwand-im-wohnzimmer",
        objectType: "Doppelhaushälfte",
        duration: "7 Wochen",
        material: "Weiß lackiertes Multiplex",
        challenge:
          "Eine große Büchersammlung brauchte endlich Platz. In der Mitte der Wohnzimmerwand liegt eine Tür, die frei bleiben musste.",
        solution:
          "Wir haben die Bücherwand vom Boden bis zur Decke um die Tür herum gebaut. Die Fachböden sind 25 mm stark, damit sie auch volle Reihen tragen, ohne sich zu biegen.",
      },
      en: {
        title: "Bookcase wall in the living room",
        slug: "bookcase-wall-in-the-living-room",
        objectType: "Semi-detached house",
        duration: "7 weeks",
        material: "White lacquered plywood",
        challenge:
          "A large collection of books finally needed a home. There is a door in the middle of the living room wall that had to stay clear.",
        solution:
          "We built the bookcase from floor to ceiling around the door. The shelves are 25 mm thick so they carry full rows without bending.",
      },
    },
  },
  {
    service: "schraenke-und-moebel",
    year: 2023,
    cover: "projekt-badmoebel.jpg",
    gallery: [],
    order: 6,
    text: {
      de: {
        title: "Badmöbel aus Massivholz",
        slug: "badmoebel-aus-massivholz",
        objectType: "Einfamilienhaus",
        duration: "5 Wochen",
        material: "Massivholz, geölt",
        challenge:
          "Das Bad ist klein, und der Waschtisch sollte frei an der Wand hängen, damit sich der Boden leicht putzen lässt. Holz im Bad muss mit Feuchtigkeit zurechtkommen.",
        solution:
          "Wir haben einen wandhängenden Waschtisch aus Massivholz mit Aufsatzbecken gebaut. Die Oberfläche ist mehrfach geölt und hält Spritzwasser stand.",
      },
      en: {
        title: "Bathroom furniture in solid wood",
        slug: "bathroom-furniture-in-solid-wood",
        objectType: "Detached house",
        duration: "5 weeks",
        material: "Solid wood, oiled",
        challenge:
          "The bathroom is small, and the vanity was to hang on the wall so the floor is easy to clean. Wood in a bathroom has to cope with moisture.",
        solution:
          "We built a wall-hung vanity in solid wood with a countertop basin. The surface is oiled several times and stands up to splashes.",
      },
    },
  },
];

const WORKING_HOURS: Localized<string> = {
  de: "Mo–Do 7:00–16:30, Fr 7:00–12:00",
  en: "Mon–Thu 7:00–16:30, Fri 7:00–12:00",
};

const BENEFITS: Localized<string[]> = {
  de: [
    "Feste Arbeitszeiten, freitags ist um 12 Uhr Schluss",
    "Moderne Maschinen in der Werkstatt",
    "Eigenes Fahrzeug für die Montage",
    "Unterstützung, wenn du deinen Meister machen willst",
  ],
  en: [
    "Fixed working hours, Fridays finish at noon",
    "Modern machines in the workshop",
    "A company vehicle for installation jobs",
    "Support if you want to train as a master craftsman",
  ],
};

export const jobs: JobSeed[] = [
  {
    employmentType: "full_time",
    payMin: 19,
    payMax: 23,
    payUnit: "hour",
    datePosted: "2026-11-02T12:00:00.000Z",
    order: 1,
    text: {
      de: {
        title: "Schreiner (m/w/d)",
        slug: "schreiner",
        start: "ab sofort",
        hours: WORKING_HOURS.de,
        intro:
          "Du hast deine Ausbildung als Schreiner abgeschlossen und willst Möbel bauen, die du vom Zuschnitt bis zur Montage begleitest? Bei uns arbeitest du in einem Team von neun Leuten an Küchen, Schränken und Türen für Kunden aus der Gegend.",
        tasks: [
          "Küchen, Möbel und Türen nach Zeichnung fertigen",
          "An Formatkreissäge, Kantenanleimmaschine und CNC arbeiten",
          "Oberflächen schleifen, ölen und lackieren",
          "Bei Montagen beim Kunden mit anpacken",
        ],
        requirements: [
          "Abgeschlossene Ausbildung als Schreiner oder Tischler",
          "Sorgfalt und ein Auge für saubere Kanten",
          "Führerschein Klasse B",
          "Verständigung auf Deutsch im Team und mit Kunden",
        ],
        benefits: BENEFITS.de,
      },
      en: {
        title: "Joiner (m/f/d)",
        slug: "joiner",
        start: "immediately",
        hours: WORKING_HOURS.en,
        intro:
          "You have finished your apprenticeship as a joiner and want to build furniture you follow from cutting to installation? With us you work in a team of nine on kitchens, cabinets and doors for customers in the area.",
        tasks: [
          "Making kitchens, furniture and doors from drawings",
          "Working on the panel saw, edge bander and CNC machine",
          "Sanding, oiling and lacquering surfaces",
          "Helping with installations at customers' homes",
        ],
        requirements: [
          "A completed apprenticeship as a joiner or cabinetmaker",
          "Care and an eye for clean edges",
          "A category B driving licence",
          "German good enough for the team and for customers",
        ],
        benefits: BENEFITS.en,
      },
    },
  },
  {
    employmentType: "full_time",
    payMin: 18,
    payMax: 21,
    payUnit: "hour",
    datePosted: "2026-11-02T12:00:00.000Z",
    order: 2,
    text: {
      de: {
        title: "Monteur für Möbel und Küchen (m/w/d)",
        slug: "monteur",
        start: "ab sofort",
        hours: WORKING_HOURS.de,
        intro:
          "Du baust gern beim Kunden ein und sorgst dafür, dass am Ende alles passt? Als Monteur bist du das Gesicht unserer Werkstatt vor Ort: Du montierst Küchen, Schränke und Türen, die wir in Wendelfing gebaut haben.",
        tasks: [
          "Küchen, Einbauschränke und Türen beim Kunden montieren",
          "Vor Ort anpassen, wenn Wände nicht gerade sind",
          "Arbeitsplatten zuschneiden und Geräte einbauen",
          "Die Baustelle sauber übergeben und mit dem Kunden abnehmen",
        ],
        requirements: [
          "Ausbildung als Schreiner oder Erfahrung in der Möbel- oder Küchenmontage",
          "Führerschein Klasse B",
          "Ruhe, wenn etwas nicht nach Plan läuft",
          "Freundlicher Umgang mit Kunden",
        ],
        benefits: [
          ...BENEFITS.de,
          "Baustellen im Umkreis von 40 km, abends bist du zu Hause",
        ],
      },
      en: {
        title: "Furniture and kitchen fitter (m/f/d)",
        slug: "fitter",
        start: "immediately",
        hours: WORKING_HOURS.en,
        intro:
          "You enjoy fitting things at customers' homes and make sure everything fits in the end? As a fitter you are the face of our workshop on site: you install kitchens, cabinets and doors that we built in Wendelfing.",
        tasks: [
          "Installing kitchens, built-in wardrobes and doors at customers' homes",
          "Adjusting on site when walls are not straight",
          "Cutting worktops and fitting appliances",
          "Leaving the site clean and doing the handover with the customer",
        ],
        requirements: [
          "An apprenticeship as a joiner or experience fitting furniture or kitchens",
          "A category B driving licence",
          "Staying calm when something does not go to plan",
          "A friendly manner with customers",
        ],
        benefits: [
          ...BENEFITS.en,
          "Jobs within 40 km, so you are home in the evening",
        ],
      },
    },
  },
  {
    employmentType: "apprenticeship",
    datePosted: "2026-11-02T12:00:00.000Z",
    order: 3,
    text: {
      de: {
        title: "Ausbildung zum Schreiner (m/w/d)",
        slug: "ausbildung-schreiner",
        start: "September 2027",
        hours: `${WORKING_HOURS.de}, dazu Berufsschule`,
        payText: "1. Jahr 900 €, 2. Jahr 1.000 €, 3. Jahr 1.100 € im Monat",
        intro:
          "Du arbeitest gern mit den Händen und willst abends sehen, was du geschafft hast? In drei Jahren lernst du bei uns alles, was ein Schreiner können muss: vom Zeichnen über die Arbeit an den Maschinen bis zur Montage beim Kunden.",
        tasks: [
          "Holz und Platten auswählen, zuschneiden und verarbeiten",
          "Mit Handwerkzeug, Elektrowerkzeug und an Maschinen arbeiten",
          "Eigene Stücke bauen, vom Hocker bis zum Gesellenstück",
          "Bei Montagen dabei sein und Kunden kennenlernen",
        ],
        requirements: [
          "Ein Schulabschluss – welcher, ist uns nicht so wichtig",
          "Freude an der Arbeit mit Holz",
          "Genauigkeit und Geduld",
          "Am besten vorher ein Schnuppertag bei uns",
        ],
        benefits: [
          "Johannes Tannrieder, Schreinermeister, bildet dich selbst aus",
          ...BENEFITS.de,
        ],
      },
      en: {
        title: "Apprenticeship as a joiner (m/f/d)",
        slug: "apprenticeship-joiner",
        start: "September 2027",
        hours: `${WORKING_HOURS.en}, plus vocational school`,
        payText: "1st year €900, 2nd year €1,000, 3rd year €1,100 per month",
        intro:
          "You like working with your hands and want to see in the evening what you have achieved? In three years you learn everything a joiner needs: from drawing and working the machines to installing at customers' homes.",
        tasks: [
          "Choosing, cutting and working wood and panels",
          "Working with hand tools, power tools and machines",
          "Building your own pieces, from a stool to your journeyman's piece",
          "Joining installations and meeting customers",
        ],
        requirements: [
          "A school leaving certificate – which one matters less to us",
          "Enjoying working with wood",
          "Precision and patience",
          "Ideally a taster day with us first",
        ],
        benefits: [
          "Johannes Tannrieder, master joiner, trains you himself",
          ...BENEFITS.en,
        ],
      },
    },
  },
];

export const team: TeamSeed[] = [
  {
    name: "Johannes Tannrieder",
    since: 2003,
    order: 1,
    role: { de: "Schreinermeister, Inhaber", en: "Master joiner, owner" },
  },
  {
    name: "Georg Tannrieder",
    since: 1989,
    order: 2,
    role: { de: "Gründer, im Ruhestand", en: "Founder, retired" },
  },
  {
    name: "Katharina Fischer",
    since: 2012,
    order: 3,
    role: { de: "Schreinerin", en: "Joiner" },
  },
  {
    name: "Markus Weber",
    since: 2008,
    order: 4,
    role: { de: "Schreiner", en: "Joiner" },
  },
  {
    name: "Sebastian Lang",
    since: 2016,
    order: 5,
    role: { de: "Schreiner", en: "Joiner" },
  },
  {
    name: "Florian Schmid",
    since: 2020,
    order: 6,
    role: { de: "Schreiner", en: "Joiner" },
  },
  {
    name: "Tobias Maier",
    since: 2014,
    order: 7,
    role: { de: "Monteur", en: "Fitter" },
  },
  {
    name: "Jonas Bauer",
    since: 2025,
    order: 8,
    role: { de: "Azubi, 2. Lehrjahr", en: "Apprentice, 2nd year" },
  },
  {
    name: "Mia Wagner",
    since: 2026,
    order: 9,
    role: { de: "Azubi, 1. Lehrjahr", en: "Apprentice, 1st year" },
  },
  {
    name: "Anna Huber",
    since: 2010,
    order: 10,
    role: { de: "Büro", en: "Office" },
  },
];

export const testimonials: TestimonialSeed[] = [
  {
    project: "wohnkueche-in-eiche",
    order: 1,
    text: {
      de: {
        quote:
          "Die Küche passt auf den Zentimeter, und die Monteure haben jeden Abend aufgeräumt. Nach neun Wochen konnten wir darin kochen.",
        author: "Familie K., Einfamilienhaus",
      },
      en: {
        quote:
          "The kitchen fits to the centimetre, and the fitters tidied up every evening. Nine weeks later we were cooking in it.",
        author: "The K. family, detached house",
      },
    },
  },
  {
    project: "einbauschrank-unter-der-dachschraege",
    order: 2,
    text: {
      de: {
        quote:
          "Unter unserer Dachschräge stand früher nur Gerümpel. Jetzt ist es das ordentlichste Zimmer der Wohnung.",
        author: "Sabine M., Dachgeschosswohnung",
      },
      en: {
        quote:
          "Under our sloping ceiling there used to be nothing but clutter. Now it is the tidiest room in the flat.",
        author: "Sabine M., attic flat",
      },
    },
  },
  {
    project: "innentueren-fuer-einen-altbau",
    order: 3,
    text: {
      de: {
        quote:
          "In unserem Altbau hatte keine Tür das gleiche Maß. Herr Tannrieder hat jede einzeln aufgemessen, und alle schließen sauber.",
        author: "Thomas und Eva R., Altbau",
      },
      en: {
        quote:
          "No two doors in our old building were the same size. Mr Tannrieder measured each one, and they all close perfectly.",
        author: "Thomas and Eva R., period building",
      },
    },
  },
];

export const homePage = {
  heroImage: "hero-1.jpg" as PhotoFile,
  aboutImage: "about-werkstatt.jpg" as PhotoFile,
  careersImage: "karriere.jpg" as PhotoFile,
  /** German project slugs, in the order they appear. */
  featuredProjects: [
    "wohnkueche-in-eiche",
    "einbauschrank-unter-der-dachschraege",
    "innentueren-fuer-einen-altbau",
  ],
  text: {
    de: {
      hero: {
        title: "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
        text: "Küchen, Einbauschränke, Türen und Innenausbau – geplant, gebaut und montiert von unserem Team.",
        facts: [
          { highlight: "Meisterbetrieb", text: "seit 1989" },
          { highlight: "Neun Leute", text: "in der eigenen Werkstatt" },
          { highlight: "Montage", text: "im Umkreis von 40 km" },
        ],
      },
      processSteps: [
        {
          title: "Aufmaß vor Ort",
          text: "Wir kommen zu Ihnen, messen den Raum aus und besprechen, was Sie brauchen.",
        },
        {
          title: "Entwurf und Angebot",
          text: "Sie bekommen einen Entwurf mit Zeichnungen und ein festes Angebot. Wir ändern, bis alles passt.",
        },
        {
          title: "Fertigung in der Werkstatt",
          text: "Alle Teile entstehen in unserer Werkstatt in Wendelfing. Den Stand können Sie sich jederzeit ansehen.",
        },
        {
          title: "Montage",
          text: "Unser Team baut bei Ihnen ein, sauber und zum vereinbarten Termin.",
        },
      ],
      sceneCaptions: [
        "Zuschnitt: Jedes Teil wird in unserer Werkstatt millimetergenau zugeschnitten.",
        "Korpus: Seiten, Boden und Deckel werden verleimt und verschraubt.",
        "Innenleben: Rückwand, Fachböden und Kleiderstange kommen hinein.",
        "Fronten: Die Türen werden eingepasst und ausgerichtet.",
        "Montage: Wir bauen bei Ihnen ein – sauber und pünktlich.",
        "Fertig. Vom Aufmaß bis zur Montage in 8–10 Wochen.",
      ],
      sceneButton: "Projekt anfragen",
      about: {
        title: "Familienbetrieb seit 1989",
        text: "Georg Tannrieder hat die Werkstatt 1989 in Wendelfing gegründet. Heute führt sein Sohn Johannes Tannrieder, Schreinermeister, den Betrieb – mit vier Schreinern, einem Monteur, zwei Auszubildenden und Anna Huber im Büro.\n\nWir arbeiten im Umkreis von etwa 40 km. Alles, was wir bei Ihnen montieren, entsteht vorher in unserer eigenen Werkstatt, und wer bei Ihnen einbaut, kennt das Stück von Anfang an.",
      },
      careers: {
        title: "Wir suchen Verstärkung",
        text: "Für Werkstatt und Montage suchen wir Verstärkung, dazu Auszubildende ab September 2027. Bei uns gibt es feste Arbeitszeiten, freitags ist um 12 Uhr Schluss, und in der Werkstatt stehen moderne Maschinen.",
        benefits: BENEFITS.de,
      },
      meta: {
        title: "Schreinerei Tannrieder – Möbel nach Maß aus Wendelfing",
        description:
          "Küchen, Einbauschränke, Türen und Innenausbau aus unserer Werkstatt in Wendelfing. Vom Aufmaß bis zur Montage in 8–10 Wochen.",
      },
    },
    en: {
      hero: {
        title: "Made-to-measure furniture from our workshop in Wendelfing",
        text: "Kitchens, built-in wardrobes, doors and interior fit-out – planned, built and installed by our team.",
        facts: [
          { highlight: "Master craftsman's workshop", text: "since 1989" },
          { highlight: "Nine people", text: "in our own workshop" },
          { highlight: "Installation", text: "within 40 km" },
        ],
      },
      processSteps: [
        {
          title: "Measuring on site",
          text: "We come to your home, measure the room and talk about what you need.",
        },
        {
          title: "Design and quote",
          text: "You get a design with drawings and a fixed quote. We make changes until everything is right.",
        },
        {
          title: "Made in our workshop",
          text: "Every part is made in our workshop in Wendelfing. You are welcome to come and see the progress at any time.",
        },
        {
          title: "Installation",
          text: "Our team installs everything in your home, cleanly and on the agreed date.",
        },
      ],
      sceneCaptions: [
        "Cutting: every part is cut to the millimetre in our workshop.",
        "Carcass: sides, base and top are glued and screwed together.",
        "Interior: back panel, shelves and hanging rail go in.",
        "Doors: the doors are fitted and aligned.",
        "Installation: we fit it in your home – clean and on time.",
        "Done. From measuring to installation in 8–10 weeks.",
      ],
      sceneButton: "Request a project",
      about: {
        title: "Family business since 1989",
        text: "Georg Tannrieder founded the workshop in Wendelfing in 1989. Today his son Johannes Tannrieder, a master joiner, runs the business – with four joiners, a fitter, two apprentices and Anna Huber in the office.\n\nWe work within about 40 km. Everything we install in your home is made in our own workshop first, and the people who fit it have known the piece from the start.",
      },
      careers: {
        title: "We're hiring",
        text: "We are looking for people for the workshop and for installation, plus apprentices starting in September 2027. You get fixed working hours, Fridays finish at noon, and the workshop has modern machines.",
        benefits: BENEFITS.en,
      },
      meta: {
        title:
          "Schreinerei Tannrieder – furniture made to measure in Wendelfing",
        description:
          "Kitchens, built-in wardrobes, doors and interior fit-out from our workshop in Wendelfing. From measuring to installation in 8–10 weeks.",
      },
    },
  },
};

export const siteSettings = {
  company: {
    name: "Schreinerei Tannrieder",
    owner: "Johannes Tannrieder",
    logoWord: "Tannrieder",
    street: "Werkstattweg 4",
    postalCode: "85999",
    city: "Wendelfing",
    phone: "089 99998 412",
    email: "info@tannrieder.example",
  },
  tagline: {
    de: "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
    en: "Joinery with its own workshop in Wendelfing, since 1989.",
  },
  openingHours: [
    { hours: "7:00–16:30", days: { de: "Mo–Do", en: "Mon–Thu" } },
    { hours: "7:00–12:00", days: { de: "Fr", en: "Fri" } },
  ],
  serviceArea: {
    de: "Wir arbeiten im Umkreis von etwa 40 km um Wendelfing. Aufmaß, Fertigung und Montage machen wir mit unserem eigenen Team.",
    en: "We work within about 40 km of Wendelfing. Measuring, making and installing are all done by our own team.",
  },
  imprint: {
    de: richText([
      { h2: "Konzeptprojekt" },
      {
        p: "Diese Website ist ein Portfolio-Projekt. Die Schreinerei Tannrieder, ihr Team, ihre Referenzen, Kundenstimmen und Stellen sind frei erfunden. Wer über die Formulare schreibt, erreicht keinen Handwerksbetrieb, sondern den Betreiber dieser Website.",
      },
      { h2: "Angaben zur Firma (Beispiel)" },
      {
        p: "Schreinerei Tannrieder, Inhaber Johannes Tannrieder, Schreinermeister",
      },
      { p: "Werkstattweg 4, 85999 Wendelfing" },
      {
        p: "Telefon: 089 99998 412 – eine Nummer, die für Filme und Bücher reserviert ist und nicht vergeben wird.",
      },
      {
        p: "E-Mail: info@tannrieder.example – die Adresse gibt es nicht.",
      },
      {
        p: "Eine Registernummer oder Steuernummer gibt es nicht, weil es die Firma nicht gibt.",
      },
    ]),
    en: richText([
      { h2: "Concept project" },
      {
        p: "This website is a portfolio project. Schreinerei Tannrieder, its team, projects, testimonials and jobs are entirely fictional. Anyone writing through the forms does not reach a carpentry business but the operator of this website.",
      },
      { h2: "Company details (sample)" },
      { p: "Schreinerei Tannrieder, owner Johannes Tannrieder, master joiner" },
      { p: "Werkstattweg 4, 85999 Wendelfing, Germany" },
      {
        p: "Phone: 089 99998 412 – a number reserved for films and books that is never assigned.",
      },
      {
        p: "Email: info@tannrieder.example – this address does not exist.",
      },
      {
        p: "There is no register number or tax number, because the company does not exist.",
      },
    ]),
  } satisfies Localized<RichText>,
  privacy: {
    de: richText([
      { h2: "Kurz gesagt" },
      {
        p: "Diese Website setzt keine Cookies, zählt keine Besucher und lädt nichts von fremden Servern. Schriften, Bilder und Programmcode kommen von der eigenen Adresse der Website.",
      },
      { h2: "Hosting" },
      {
        p: "Die Website wird bei Vercel Inc. gehostet, die Serverfunktionen laufen in Frankfurt am Main. Beim Aufruf einer Seite verarbeitet der Server technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Adresse, um die Seite auszuliefern und vor Missbrauch zu schützen.",
      },
      { h2: "Formulare" },
      {
        p: "Wenn Sie eine Anfrage oder Bewerbung absenden, wird der Inhalt über den E-Mail-Dienst Resend an den Betreiber dieser Website geschickt. Auf der Website selbst wird nichts gespeichert. Die E-Mail wird gelöscht, sobald sie nicht mehr gebraucht wird.",
      },
      { h2: "Ihre Rechte" },
      {
        p: "Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Verantwortlich ist der im Impressum genannte Betreiber dieser Website.",
      },
    ]),
    en: richText([
      { h2: "In short" },
      {
        p: "This website sets no cookies, does not count visitors and loads nothing from other servers. Fonts, images and code are served from the website's own address.",
      },
      { h2: "Hosting" },
      {
        p: "The website is hosted by Vercel Inc., and its server functions run in Frankfurt am Main. When a page is requested, the server processes technically necessary data such as the IP address, time and requested address in order to deliver the page and protect it from abuse.",
      },
      { h2: "Forms" },
      {
        p: "When you send a request or an application, its content is sent to the operator of this website via the email service Resend. Nothing is stored on the website itself. The email is deleted as soon as it is no longer needed.",
      },
      { h2: "Your rights" },
      {
        p: "You have the right to access, correct, delete and restrict the processing of your data, and the right to lodge a complaint with a data protection authority. The controller is the operator of this website named in the imprint.",
      },
    ]),
  } satisfies Localized<RichText>,
};
