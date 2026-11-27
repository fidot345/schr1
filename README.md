# Schreinerei Tannrieder — website of a carpentry workshop (demo)

A portfolio concept project: the website of a fictional family carpentry workshop, Schreinerei Tannrieder, in Upper Bavaria. The company, its people, projects and job openings are invented. The site has two languages: German is the default, English lives under `/en`. The home page has a 3D scene, "Vom Brett zum Schrank" (from board to wardrobe): a wardrobe assembles itself from boards as you scroll.

Demo: https://schr1.vercel.app. Search engines are kept out (see [Demo mode](#demo-mode)).

## Stack

- Node.js 26, npm
- Next.js 16 (App Router), React 19, TypeScript in strict mode
- Payload CMS 3.93.0 inside the same app: admin panel at `/admin`, pages read their data through the Local API
- PostgreSQL on Neon, photos in Vercel Blob
- Tailwind CSS 4, fonts through `next/font` (served from our own domain)
- next-intl: German without a prefix in the address, English under `/en`
- 3D: three.js, `@react-three/fiber`, `@react-three/drei`; scrolling with GSAP ScrollTrigger and Lenis
- Forms: Server Actions and Zod; mail through Resend
- Tests: Vitest, Playwright, `@axe-core/playwright`; linter and formatter: Biome

Exact versions are in [`package.json`](package.json).

Why this stack:

- **Payload instead of texts in code.** The workshop edits its jobs, projects and opening hours on its own. Payload runs inside Next.js: one project, one deploy, TypeScript everywhere.
- **Neon.** Free PostgreSQL in the cloud, with database branches for development, previews and production.
- **Vercel.** Made by the Next.js team: deploys from GitHub, a preview for every pull request.
- **Resend.** Simple mail sending. Without its own domain it sends only to the account owner's address, which is exactly what a demo needs.
- **Biome.** One fast tool instead of two.

## Key decisions

- **Static pages, refreshed from the admin panel.** Pages are built ahead in both languages (`generateStaticParams`) and served ready-made. Any save or delete in the admin panel calls `revalidatePath("/", "layout")`, so the whole site is up to date a few seconds later. The project list is the one page rendered per request: its filter lives in the address.
- **No cookies, no requests to other domains.** Public pages set no cookie at all (next-intl's language cookie is off; the language comes from the address only). The visitor's browser talks to our domain only: fonts are self-hosted through `next/font`, photos are streamed from Blob through `/api/media/file`, the 3D scene's light is drawn in the browser instead of loading an HDR file. No analytics, maps, video embeds or widgets. A Content-Security-Policy and the other security headers come from `next.config.ts`; e2e tests check every page for foreign requests, cookies and CSP violations.
- **3D without ready-made models.** The wardrobe is 16 parts built in code from boxes, with oak and maple textures (CC0, Poly Haven). One GSAP timeline, driven by the scroll, moves each part from the stack into the wardrobe in six steps. The captions of the steps are a real `<ol>` in the HTML; the canvas is hidden from screen readers.
- **A fallback for weak devices.** The 3D code (three.js, fiber, drei, GSAP) is not in the first load: it loads only when the section is about one screen away. With "reduce motion", without WebGL 2 or without JavaScript, the visitor gets a still picture of the finished wardrobe and all six captions as a list. Devices with little memory or few cores start with a lighter scene; if the WebGL context is lost, the scene is rebuilt lighter, and after three failed rebuilds the still picture takes its place.

## Results

Lighthouse, mobile, median of three runs on a local production build with `SITE_INDEXING=true` (measured on 26 November 2026; Chrome flag `--disable-gpu`, since headless Chromium's GPU process on the test machine adds blocking time to every page):

| Page | Performance DE / EN | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Home | 90 / 90 | 100 | 100 | 100 |
| Services | 92 / 92 | 100 | 100 | 100 |
| Service | 93 / 93 | 100 | 100 | 100 |
| Projects | 90 / 91 | 100 | 100 | 100 |
| Project | 91 / 91 | 100 | 100 | 100 |
| About us | 91 / 94 | 100 | 100 | 100 |
| Careers | 92 / 92 | 100 | 100 | 100 |
| Job opening | 97 / 96 | 100 | 100 | 100 |
| Project request | 97 / 96 | 100 | 100 | 100 |
| Contact | 99 / 99 | 100 | 100 | 100 |
| Impressum | 99 / 99 | 100 | 100 | 100 |
| Privacy | 99 / 99 | 100 | 100 | 100 |

- CLS is 0 on every page. Pages with a photo on the first screen score 90–94 on performance, the others 96–99. The first-load JavaScript is 164–199 KB gzip, about 136 KB of it React and Next.js.
- axe: zero violations on every page type in both languages, the thank-you pages and the 404 page included. The e2e suite runs axe on each of them.
- Zero broken links (linkinator over the whole site).

## Running it locally (Windows, PowerShell)

You need Node.js 26 LTS (`node -v` prints `v26.…`), Git and a PostgreSQL database, for example a separate branch in Neon.

```powershell
git clone https://github.com/fidot345/schr1.git Schr1
cd Schr1
npm ci
Copy-Item .env.example .env.local
```

Fill in `.env.local` (each variable is explained in the next section). For your own computer this is enough:

- `DATABASE_URI`: the connection string of your database;
- `PAYLOAD_SECRET`: a long random string; this command prints one:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`;
- `MAIL_TRANSPORT=log`: form mail is written to the server console and sent nowhere;
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

`BLOB_READ_WRITE_TOKEN` may stay empty: photos are then stored in the `media/` folder of the project (it is in `.gitignore`).

Fill the empty database with the demo content and start the site:

```powershell
npm run seed
npm run dev
```

- site: http://localhost:3000, English version: http://localhost:3000/en;
- admin panel: http://localhost:3000/admin. In an empty database Payload first asks you to create the first user.

On your own computer Payload adjusts the database tables to the schema by itself; there are no migrations to run. If it asks in the terminal, after a schema change, whether to create or rename a column, answer there.

Run tests and builds from a path with an upper-case drive letter (`F:\…`, not `f:\…`). Otherwise Vitest on Windows fails with `Cannot read properties of undefined (reading 'config')`.

## Environment variables

The repository holds only [`.env.example`](.env.example), without values. The values live in `.env.local` on your computer and in the project settings on Vercel.

| Variable | What it is for |
|---|---|
| `DATABASE_URI` | PostgreSQL connection string; for Neon, the pooled address (it contains `-pooler`) |
| `PAYLOAD_SECRET` | Payload's secret that signs admin logins; a long random string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob key for photo uploads; empty: photos go to the local `media/` folder |
| `RESEND_API_KEY` | Resend key, needed with `MAIL_TRANSPORT=resend` |
| `MAIL_TO` | the address that receives requests and applications; the same as the Resend account's |
| `MAIL_TRANSPORT` | `log`: mail is written to the server console (development, tests); `resend`: sent through Resend; empty or anything else: the forms do not send and show the phone number |
| `NEXT_PUBLIC_SITE_URL` | the site's address: for canonical links, links to the other language, the sitemap, preview images and the Google markup |
| `SITE_INDEXING` | `true` lets search engines in; empty or anything else is the demo mode, closed to indexing. Read at build time |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server on http://localhost:3000 |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | Biome: errors and style |
| `npm run format` | Biome: formatting |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright tests with axe accessibility checks, against the production build |
| `npm run seed` | demo content into an empty database (see [Where the texts and photos live](#where-the-texts-and-photos-live)) |
| `npm run generate:types` | update `src/payload-types.ts` from the Payload schema |
| `npm run generate:importmap` | update the admin panel's import map after adding your own components to it |

### Browser tests (e2e)

```powershell
npx playwright install chromium
npm run build
npm run test:e2e
```

- The first command is needed once: it downloads Chromium for Playwright.
- Run a fresh `npm run build` before every run: the tests go against the built site, not against `npm run dev`.
- Playwright starts the built site itself on http://localhost:3100 with `MAIL_TRANSPORT=log`. This setting wins over `.env.local`, so the forms send no real mail during tests.
- Port 3100 must be free: Playwright does not reuse a server already running there, it stops the run.
- `npx playwright show-report` opens the report.

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) run on every pull request and every push to `main`: `npm ci`, `typecheck`, `lint`, `test`. Vercel checks the build when it builds the preview.

## Deploying to Vercel

- The Vercel project is connected to this GitHub repository. The `main` branch is production (https://schr1.vercel.app); every pull request gets a preview with its own address.
- Vercel builds with the `vercel-build` script: `payload migrate && next build`. The migrations from `src/migrations` are applied to the database first, then the site is built.
- The Neon database has branches: `production` for production, `preview` for previews, `dev` for your own computer. `DATABASE_URI` in Vercel is set separately for the Production and Preview environments.
- Server functions run in Frankfurt (`fra1`), next to the Neon database.
- Environment variables are set in the Vercel project settings (Settings → Environment Variables). `BLOB_READ_WRITE_TOKEN` is added there by hand. `SITE_INDEXING` is read at build time, so changing it needs a new deploy.
- Node.js on Vercel is 26 (`engines` in `package.json`).
- After a change of the Payload schema: `npx payload migrate:create`, the migration file goes into the same commit as the schema, then `npm run generate:types`.

## Where the texts and photos live

- Content is edited in the admin panel at `/admin` (Payload), in both languages: services, projects, jobs, team, testimonials, company details, opening hours, Impressum and privacy policy, the home page texts and the captions of the 3D scene's steps. After a save the site refreshes by itself.
- Photos are in the admin panel's Media section; each one requires an alt text, an author and a source. The files are stored in Vercel Blob.
- Interface texts (menu, buttons, field labels, the "Konzeptprojekt" note, the holiday banner) are in [`messages/de.json`](messages/de.json) and [`messages/en.json`](messages/en.json).
- `npm run seed` ([`seed/content.ts`](seed/content.ts), photos from `seed/images/`) is only for the first fill of an empty database. **Never run it on production:** seed resets the demo documents to their original values and overwrites edits made in the admin panel. With `NODE_ENV=production` and no `BLOB_READ_WRITE_TOKEN`, seed stops by itself, so that photos do not end up only on a local disk.

## Structure

| Folder | What is inside |
|---|---|
| `src/app/(frontend)/[locale]/` | the site's pages; `globals.css` next to it holds Tailwind and the design tokens |
| `src/app/(payload)/` | Payload's admin panel and API; generated by Payload, do not edit by hand |
| `src/collections/`, `src/globals/` | the Payload data schema |
| `src/hooks/` | Payload hooks: refresh the pages after a save, refuse to delete photos that are still in use |
| `src/migrations/` | database migrations |
| `src/components/` | components by page; `ui/` shared elements, `layout/` header and footer, `wardrobe/` the 3D scene |
| `src/lib/` | data access, Server Actions and Zod schemas of the forms, mail, SEO, Google markup |
| `src/i18n/` | next-intl settings and the translated page addresses |
| `src/proxy.ts` | picks the language from the address |
| `public/textures/`, `public/images/` | textures of the 3D scene, the logo, the picture of the finished wardrobe |
| `messages/` | interface texts in German and English |
| `seed/` | demo content and its photos |
| `tests/unit/`, `tests/e2e/` | Vitest and Playwright tests |
| `docs/` | the project brief and the sources |
| `design/` | HTML mock-up of the site |

## Sources of photos, textures and fonts

Authors, links and licenses are in [`docs/credits.md`](docs/credits.md).

## Demo mode

- The company is fictional. The footer and both forms carry the note "Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen."
- Search engines are kept out: on production `SITE_INDEXING` is not `true`, so every page has `noindex, nofollow`, responses carry the `X-Robots-Tag` header, and `robots.txt` disallows the whole site.
- The phone number is one reserved for films and books (089 99998 412); the e-mail address is on the `.example` domain.
- Form mail goes only to the author of the project; requests and applications are not stored anywhere.
- Public pages set no cookie, and the visitor's browser never contacts other domains: fonts, photos and 3D are served from the site's own domain.

## License

The project's own code and files are under the [MIT License](LICENSE). Photos, textures and fonts keep their own licenses (Unsplash, Pexels, CC0, SIL OFL 1.1), listed in [`docs/credits.md`](docs/credits.md).
