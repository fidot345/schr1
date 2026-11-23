import { describe, expect, it } from "vitest";
import { AdminIcon, AdminLogo } from "@/components/admin/AdminGraphics";
import { render } from "./support/render";

describe("AdminLogo", () => {
  it("loads eagerly, it is the LCP of the login page", () => {
    expect(render(<AdminLogo />)).toMatch(/loading="eager"/);
  });

  it("draws the logo mark in its own proportions, with the company name as alt", () => {
    const html = render(<AdminLogo />);

    expect(html).toContain("logo-mark.svg");
    expect(html).toMatch(/alt="Schreinerei Tannrieder"/);
    expect(html).toMatch(/width="85"/);
    expect(html).toMatch(/height="96"/);
  });
});

describe("AdminIcon", () => {
  it("draws the logo mark small, for the navigation", () => {
    const html = render(<AdminIcon />);

    expect(html).toContain("logo-mark.svg");
    expect(html).toMatch(/alt="Schreinerei Tannrieder"/);
    expect(html).toMatch(/height="24"/);
  });
});
