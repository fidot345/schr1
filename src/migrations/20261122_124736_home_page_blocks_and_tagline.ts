import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page_hero_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_hero_facts_locales" (
  	"highlight" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_about_principles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_about_principles_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_careers_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_careers_benefits_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_careers_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_page_careers_faq_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "home_page" ADD COLUMN "about_image_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "careers_image_id" integer;
  ALTER TABLE "site_settings_locales" ADD COLUMN "tagline" varchar;
  ALTER TABLE "home_page_hero_facts" ADD CONSTRAINT "home_page_hero_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_hero_facts_locales" ADD CONSTRAINT "home_page_hero_facts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_hero_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_principles" ADD CONSTRAINT "home_page_about_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_about_principles_locales" ADD CONSTRAINT "home_page_about_principles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_about_principles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_careers_benefits" ADD CONSTRAINT "home_page_careers_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_careers_benefits_locales" ADD CONSTRAINT "home_page_careers_benefits_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_careers_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_careers_faq" ADD CONSTRAINT "home_page_careers_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_careers_faq_locales" ADD CONSTRAINT "home_page_careers_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_careers_faq"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_hero_facts_order_idx" ON "home_page_hero_facts" USING btree ("_order");
  CREATE INDEX "home_page_hero_facts_parent_id_idx" ON "home_page_hero_facts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_hero_facts_locales_locale_parent_id_unique" ON "home_page_hero_facts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_hero_facts_locales_parent_id_idx" ON "home_page_hero_facts_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_about_principles_order_idx" ON "home_page_about_principles" USING btree ("_order");
  CREATE INDEX "home_page_about_principles_parent_id_idx" ON "home_page_about_principles" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_about_principles_locales_locale_parent_id_unique" ON "home_page_about_principles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_about_principles_locales_parent_id_idx" ON "home_page_about_principles_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_careers_benefits_order_idx" ON "home_page_careers_benefits" USING btree ("_order");
  CREATE INDEX "home_page_careers_benefits_parent_id_idx" ON "home_page_careers_benefits" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_careers_benefits_locales_locale_parent_id_unique" ON "home_page_careers_benefits_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_careers_benefits_locales_parent_id_idx" ON "home_page_careers_benefits_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_careers_faq_order_idx" ON "home_page_careers_faq" USING btree ("_order");
  CREATE INDEX "home_page_careers_faq_parent_id_idx" ON "home_page_careers_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_careers_faq_locales_locale_parent_id_unique" ON "home_page_careers_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_careers_faq_locales_parent_id_idx" ON "home_page_careers_faq_locales" USING btree ("_parent_id");
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_about_image_id_media_id_fk" FOREIGN KEY ("about_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_careers_image_id_media_id_fk" FOREIGN KEY ("careers_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_about_about_image_idx" ON "home_page" USING btree ("about_image_id");
  CREATE INDEX "home_page_careers_careers_image_idx" ON "home_page" USING btree ("careers_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_hero_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_hero_facts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_principles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_about_principles_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_careers_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_careers_benefits_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_careers_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_careers_faq_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_page_hero_facts" CASCADE;
  DROP TABLE "home_page_hero_facts_locales" CASCADE;
  DROP TABLE "home_page_about_principles" CASCADE;
  DROP TABLE "home_page_about_principles_locales" CASCADE;
  DROP TABLE "home_page_careers_benefits" CASCADE;
  DROP TABLE "home_page_careers_benefits_locales" CASCADE;
  DROP TABLE "home_page_careers_faq" CASCADE;
  DROP TABLE "home_page_careers_faq_locales" CASCADE;
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_about_image_id_media_id_fk";
  
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_careers_image_id_media_id_fk";
  
  DROP INDEX "home_page_about_about_image_idx";
  DROP INDEX "home_page_careers_careers_image_idx";
  ALTER TABLE "home_page" DROP COLUMN "about_image_id";
  ALTER TABLE "home_page" DROP COLUMN "careers_image_id";
  ALTER TABLE "site_settings_locales" DROP COLUMN "tagline";`)
}
