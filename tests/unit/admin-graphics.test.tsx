import { describe, expect, it } from "vitest";
import { AdminLogo } from "@/components/admin/AdminGraphics";
import { render } from "./support/render";

describe("AdminLogo", () => {
  it("loads eagerly, it is the LCP of the login page", () => {
    expect(render(<AdminLogo />)).toMatch(/loading="eager"/);
  });
});
