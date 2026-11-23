import type { AppHref } from "@/components/ui/AppLink";
import { JOB_PARAM, TRIAL_DAY } from "@/lib/application-schema";

/*
 * Apart from ApplySection, so the home page's button does not pull the
 * application form into the home page.
 */

/** The id of the section with the application form. */
export const APPLY_SECTION_ID = "bewerben";

/**
 * Where "Schnuppertag anfragen" leads, on /karriere and on the home page:
 * the form on /karriere with the trial day chosen.
 */
export const TRIAL_DAY_HREF: AppHref = {
  pathname: "/karriere",
  query: { [JOB_PARAM]: TRIAL_DAY },
  hash: APPLY_SECTION_ID,
};
