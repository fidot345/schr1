import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_locales" ADD COLUMN "scene_button" varchar DEFAULT 'Projekt anfragen' NOT NULL;`)
  // The default is the German text; the English row gets the English one of the brief.
  await db.execute(sql`
   UPDATE "home_page_locales" SET "scene_button" = 'Request a project' WHERE "_locale" = 'en';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_locales" DROP COLUMN "scene_button";`)
}
