import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // The workshop is in Bavaria; dates such as the holiday banner use its time.
    timeZone: "Europe/Berlin",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
