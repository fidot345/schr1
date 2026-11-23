import { describe, expect, it } from "vitest";
import {
  ALLOW_LOCAL_MEDIA_FLAG,
  assertMediaStorage,
} from "../../seed/media-storage";

describe("seed media storage guard", () => {
  it("stops a production seed without a Blob token", () => {
    expect(() => assertMediaStorage({ NODE_ENV: "production" })).toThrow(
      /BLOB_READ_WRITE_TOKEN is empty/,
    );
    expect(() =>
      assertMediaStorage({ NODE_ENV: "production", BLOB_READ_WRITE_TOKEN: "" }),
    ).toThrow(/SEED_ALLOW_LOCAL_MEDIA=1/);
    expect(() =>
      assertMediaStorage({
        NODE_ENV: "production",
        BLOB_READ_WRITE_TOKEN: "  ",
      }),
    ).toThrow();
  });

  it("lets a production seed run with a Blob token", () => {
    expect(() =>
      assertMediaStorage({
        NODE_ENV: "production",
        BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_store_secret",
      }),
    ).not.toThrow();
  });

  it("lets a production seed use local files only with the explicit flag", () => {
    expect(() =>
      assertMediaStorage({
        NODE_ENV: "production",
        [ALLOW_LOCAL_MEDIA_FLAG]: "1",
      }),
    ).not.toThrow();
    expect(() =>
      assertMediaStorage({
        NODE_ENV: "production",
        [ALLOW_LOCAL_MEDIA_FLAG]: "true",
      }),
    ).toThrow();
  });

  it("keeps the dev seed with local files as it is", () => {
    expect(() => assertMediaStorage({})).not.toThrow();
    expect(() =>
      assertMediaStorage({
        NODE_ENV: "development",
        BLOB_READ_WRITE_TOKEN: "",
      }),
    ).not.toThrow();
  });
});
