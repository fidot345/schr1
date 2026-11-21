import { describe, expect, it } from "vitest";
import {
  PAGES_WITHOUT_ACTION_BAR,
  type Pathname,
  showsActionBar,
} from "@/components/layout/navigation";
import { routing } from "@/i18n/routing";

describe("showsActionBar", () => {
  it("knows every pathname from routing", () => {
    const pathnames = Object.keys(routing.pathnames) as Pathname[];
    for (const pathname of PAGES_WITHOUT_ACTION_BAR) {
      expect(pathnames).toContain(pathname);
    }
    const shown = pathnames.filter(showsActionBar);
    expect(shown).toHaveLength(
      pathnames.length - PAGES_WITHOUT_ACTION_BAR.length,
    );
  });
});
