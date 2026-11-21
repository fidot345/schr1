import { describe, expect, it } from "vitest";
import { telHref } from "@/lib/phone";

describe("telHref", () => {
  it.each([
    ["089 99998 412", "tel:+498999998412"],
    ["+49 89 99998 412", "tel:+498999998412"],
    ["+49 (0)89 99998-412", "tel:+498999998412"],
    ["0049 89 99998412", "tel:+498999998412"],
  ])("turns %s into %s", (phone, href) => {
    expect(telHref(phone)).toBe(href);
  });
});
