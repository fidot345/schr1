import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

const MESSAGES = { de, en } as const;

/** Static markup of a component, with next-intl set up like on the site. */
export const render = (node: ReactNode, locale: "de" | "en" = "de"): string =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="Europe/Berlin"
    >
      {node}
    </NextIntlClientProvider>,
  );

/** Every class name in the markup, in order. */
export const classesOf = (html: string): string[] =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

/** The opening tag of the element with this id. */
export const tagWithId = (html: string, id: string): string =>
  html.match(new RegExp(`<[a-z][a-z0-9]* [^>]*id="${id}"[^>]*>`))?.[0] ?? "";
