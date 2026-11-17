import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string): string => readFileSync(path, "utf8");

describe("project rules", () => {
  it("keeps cacheComponents out of next.config.ts", () => {
    expect(read("next.config.ts")).not.toMatch(/cacheComponents/);
  });

  it("lists every environment variable from the brief in .env.example", () => {
    const names = read(".env.example")
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => line.split("=")[0]);

    expect(names).toEqual([
      "DATABASE_URI",
      "PAYLOAD_SECRET",
      "BLOB_READ_WRITE_TOKEN",
      "RESEND_API_KEY",
      "MAIL_TO",
      "MAIL_TRANSPORT",
      "NEXT_PUBLIC_SITE_URL",
      "SITE_INDEXING",
    ]);
  });

  it("does not put values into .env.example", () => {
    const filled = read(".env.example")
      .split("\n")
      .filter((line) => line.includes("=") && line.split("=")[1]?.trim());

    expect(filled).toEqual([]);
  });
});
