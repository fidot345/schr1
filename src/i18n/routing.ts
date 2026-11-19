import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  pathnames: {
    "/": { de: "/", en: "/" },
    "/leistungen": { de: "/leistungen", en: "/services" },
    "/leistungen/[slug]": { de: "/leistungen/[slug]", en: "/services/[slug]" },
    "/referenzen": { de: "/referenzen", en: "/projects" },
    "/referenzen/[slug]": { de: "/referenzen/[slug]", en: "/projects/[slug]" },
    "/ueber-uns": { de: "/ueber-uns", en: "/about" },
    "/karriere": { de: "/karriere", en: "/careers" },
    "/karriere/[slug]": { de: "/karriere/[slug]", en: "/careers/[slug]" },
    "/karriere/danke": { de: "/karriere/danke", en: "/careers/thank-you" },
    "/anfrage": { de: "/anfrage", en: "/request" },
    "/anfrage/danke": { de: "/anfrage/danke", en: "/request/thank-you" },
    "/kontakt": { de: "/kontakt", en: "/contact" },
    "/impressum": { de: "/impressum", en: "/imprint" },
    "/datenschutz": { de: "/datenschutz", en: "/privacy" },
  },
});

export type Locale = (typeof routing.locales)[number];
