import { createTranslator } from "next-intl";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

/*
 * A stand-in for next-intl/server, which needs the Next.js runtime, with
 * the site's own messages:
 *
 *   vi.mock("next-intl/server", () => import("./support/translations"));
 */

const MESSAGES = { de, en } as const;

type Options = { locale: "de" | "en"; namespace?: keyof typeof de };

export const getTranslations = async ({ locale, namespace }: Options) =>
  createTranslator({ locale, messages: MESSAGES[locale], namespace });

export const setRequestLocale = (): void => {};
