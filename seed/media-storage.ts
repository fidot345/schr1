/**
 * Opt-in for seeding a production-mode database while photos go to the
 * local media/ folder (for example a temporary database for a migration
 * check). Set it to "1".
 */
export const ALLOW_LOCAL_MEDIA_FLAG = "SEED_ALLOW_LOCAL_MEDIA";

type SeedEnv = Partial<
  Record<
    "NODE_ENV" | "BLOB_READ_WRITE_TOKEN" | typeof ALLOW_LOCAL_MEDIA_FLAG,
    string
  >
>;

/**
 * Stops a seed that would write production rows for photos that never reach
 * Vercel Blob. Without the token the blob plugin is off, Payload saves the
 * files to the local media/ folder, and the deployed site answers 404 for
 * every photo. Seeding the database with migrations (production, preview)
 * runs with NODE_ENV=production, so that is the case to guard.
 */
export const assertMediaStorage = (env: SeedEnv): void => {
  if (env.NODE_ENV !== "production") {
    return;
  }
  if (env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return;
  }
  if (env[ALLOW_LOCAL_MEDIA_FLAG] === "1") {
    return;
  }
  throw new Error(
    "Seed stopped: NODE_ENV=production but BLOB_READ_WRITE_TOKEN is empty, " +
      "so the photos would go to the local media/ folder and the deployed site " +
      "would answer 404 for them. Set BLOB_READ_WRITE_TOKEN of the target " +
      `environment, or ${ALLOW_LOCAL_MEDIA_FLAG}=1 if local files are intended ` +
      "(a temporary database).",
  );
};
