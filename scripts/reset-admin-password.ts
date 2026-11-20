/*
 * npm run reset-admin: sets a new password for an existing admin user.
 * Needed while the admin panel cannot send "forgot password" emails.
 *
 * Reads ADMIN_EMAIL and NEW_ADMIN_PASSWORD from the environment and
 * DATABASE_URI for the target database. Never creates a user and never
 * prints the password. Also lifts the lock after too many failed logins.
 *
 * Must run with NODE_ENV=production: in development mode Payload pushes
 * the schema to the database on start, which a migrated database
 * (production) must never get.
 */

import { getPayload } from "payload";
import config from "../src/payload.config";

const MIN_PASSWORD_LENGTH = 12;

function fail(message: string): never {
  console.error(`reset-admin: ${message}`);
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  fail(
    "NODE_ENV must be 'production', otherwise Payload changes the database schema on start.",
  );
}

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const password = process.env.NEW_ADMIN_PASSWORD ?? "";

if (!email) {
  fail("ADMIN_EMAIL is not set.");
}
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(
    `NEW_ADMIN_PASSWORD is missing or shorter than ${MIN_PASSWORD_LENGTH} characters.`,
  );
}

const databaseHost = (() => {
  try {
    return new URL(process.env.DATABASE_URI ?? "").hostname;
  } catch {
    return fail("DATABASE_URI is not set or is not a valid connection string.");
  }
})();

console.info(`reset-admin: database host ${databaseHost}`);

/** The script runs outside Next.js, so the revalidate hook must stay quiet. */
const context = { disableRevalidate: true };

const payload = await getPayload({ config });

const found = await payload.find({
  collection: "users",
  where: { email: { equals: email } },
  depth: 0,
  limit: 1,
  pagination: false,
  overrideAccess: true,
});

const user = found.docs[0];
if (!user) {
  fail(`no user with the e-mail ${email} in this database. Nothing changed.`);
}

await payload.update({
  collection: "users",
  id: user.id,
  data: { password },
  depth: 0,
  overrideAccess: true,
  context,
});

/* The generated type asks for a password too, the unlock itself reads only the e-mail. */
await payload.unlock({
  collection: "users",
  data: { email, password },
  overrideAccess: true,
});

console.info(
  `reset-admin: new password saved for ${email}. Other sessions are signed out.`,
);

process.exit(0);
