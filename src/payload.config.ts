import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { de } from "@payloadcms/translations/languages/de";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Jobs } from "./collections/Jobs";
import { Media } from "./collections/Media";
import { Projects } from "./collections/Projects";
import { Services } from "./collections/Services";
import { Team } from "./collections/Team";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";
import { HomePage } from "./globals/HomePage";
import { SiteSettings } from "./globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export default buildConfig({
  admin: {
    user: Users.slug,
    // Payload's default, gravatar, would load each user's picture from
    // www.gravatar.com: another host, which the Content-Security-Policy of
    // next.config.ts blocks. The built-in icon comes from our own domain.
    avatar: "default",
    components: {
      graphics: {
        Logo: "/components/admin/AdminGraphics#AdminLogo",
        Icon: "/components/admin/AdminGraphics#AdminIcon",
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Services, Projects, Jobs, Team, Testimonials, Media, Users],
  globals: [HomePage, SiteSettings],
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: "de",
  },
  localization: {
    locales: [
      { code: "de", label: "Deutsch" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "de",
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      token: blobToken,
      collections: { media: true },
      alwaysInsertFields: true,
    }),
  ],
});
