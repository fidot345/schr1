# Schreinerei Tannrieder — сайт столярной мастерской (демо)

Концепт-проект для портфолио: сайт вымышленной семейной столярной мастерской «Schreinerei Tannrieder» из Верхней Баварии. Фирма, люди, работы и вакансии придуманы. Сайт на двух языках: немецкий — основной, английский — под `/en`. На главной есть 3D-сцена «Vom Brett zum Schrank»: шкаф собирается из досок, пока страницу прокручивают.

Демо: https://schr1.vercel.app — закрыто от поисковиков (см. [«Демо-режим»](#демо-режим)).

## Стек

- Node.js 26, npm
- Next.js 16 (App Router), React 19, TypeScript в строгом режиме
- Payload CMS 3.93.0 в том же приложении: админка `/admin`, страницы читают данные через Local API
- PostgreSQL на Neon, фото в Vercel Blob
- Tailwind CSS 4, шрифты через `next/font` (отдаются с нашего домена)
- next-intl: немецкий без префикса в адресе, английский под `/en`
- 3D: three.js, `@react-three/fiber`, `@react-three/drei`; прокрутка — GSAP ScrollTrigger и Lenis
- Формы: Server Actions и Zod; письма — Resend
- Тесты: Vitest, Playwright, `@axe-core/playwright`; линтер и форматтер — Biome

Точные версии — в [`package.json`](package.json).

## Запуск на своём компьютере (Windows, PowerShell)

Понадобятся Node.js 26 LTS (`node -v` показывает `v26.…`), Git и база PostgreSQL — например, отдельная ветка в Neon.

```powershell
git clone https://github.com/fidot345/schr1.git Schr1
cd Schr1
npm ci
Copy-Item .env.example .env.local
```

Заполните `.env.local` (что значит каждая переменная — в следующем разделе). Для работы на своём компьютере хватит такого:

- `DATABASE_URI` — строка подключения к вашей базе;
- `PAYLOAD_SECRET` — длинная случайная строка, её выдаст команда
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`;
- `MAIL_TRANSPORT=log` — письма форм пишутся в консоль сервера и никуда не уходят;
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

`BLOB_READ_WRITE_TOKEN` можно оставить пустым: тогда фото сохраняются в папку `media/` в проекте (она в `.gitignore`).

Наполните пустую базу демо-контентом и запустите сайт:

```powershell
npm run seed
npm run dev
```

- сайт: http://localhost:3000, английская версия: http://localhost:3000/en;
- админка: http://localhost:3000/admin — в пустой базе Payload сначала попросит создать первого пользователя.

На своём компьютере Payload сам подстраивает таблицы базы под схему, миграции запускать не нужно. Если после смены схемы он спросит в терминале, создать столбец или переименовать, ответьте там же.

Тесты и сборку запускайте из пути с заглавной буквой диска (`F:\…`, а не `f:\…`). Иначе Vitest на Windows падает с ошибкой `Cannot read properties of undefined (reading 'config')`.

## Переменные окружения

В репозитории лежит только [`.env.example`](.env.example) без значений. Значения хранятся в `.env.local` на своём компьютере и в настройках проекта на Vercel.

| Переменная | Для чего |
|---|---|
| `DATABASE_URI` | строка подключения к PostgreSQL; для Neon — адрес с пулом соединений (в нём есть `-pooler`) |
| `PAYLOAD_SECRET` | секрет Payload, которым подписывается вход в админку; длинная случайная строка |
| `BLOB_READ_WRITE_TOKEN` | ключ Vercel Blob, куда загружаются фото; пустой — фото в локальной папке `media/` |
| `RESEND_API_KEY` | ключ Resend, нужен при `MAIL_TRANSPORT=resend` |
| `MAIL_TO` | адрес, на который приходят заявки и отклики; тот же, что у аккаунта Resend |
| `MAIL_TRANSPORT` | `log` — письмо пишется в консоль сервера (разработка, тесты); `resend` — отправка через Resend; пусто или другое значение — формы не отправляют и показывают телефон |
| `NEXT_PUBLIC_SITE_URL` | адрес сайта: для canonical, ссылок на другой язык, sitemap, картинок превью и разметки для Google |
| `SITE_INDEXING` | `true` пускает поисковики; пусто или другое значение — демо-режим, сайт закрыт от индексации. Читается при сборке |

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | разработка на http://localhost:3000 |
| `npm run build` | продакшен-сборка |
| `npm run start` | запуск собранного сайта |
| `npm run typecheck` | проверка типов TypeScript |
| `npm run lint` | Biome: ошибки и стиль |
| `npm run format` | Biome: форматирование |
| `npm run test` | юнит-тесты Vitest |
| `npm run test:e2e` | тесты Playwright с проверкой доступности axe — против продакшен-сборки |
| `npm run seed` | демо-контент в пустую базу (см. [«Где лежат тексты и фото»](#где-лежат-тексты-и-фото)) |
| `npm run generate:types` | обновить `src/payload-types.ts` по схеме Payload |
| `npm run generate:importmap` | обновить карту импортов админки после добавления в неё своих компонентов |

### Тесты в браузере (e2e)

```powershell
npx playwright install chromium
npm run build
npm run test:e2e
```

- Первая команда нужна один раз: она скачивает Chromium для Playwright.
- Перед каждым прогоном — свежий `npm run build`: тесты идут против собранного сайта, а не против `npm run dev`.
- Playwright сам запускает собранный сайт на http://localhost:3100 с `MAIL_TRANSPORT=log`. Эта настройка сильнее `.env.local`, поэтому формы в тестах не отправляют настоящих писем.
- Порт 3100 должен быть свободен: чужой сервер Playwright не использует, а останавливает прогон.
- Отчёт открывается командой `npx playwright show-report`.

Проверки в GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) на каждый pull request и push в `main`: `npm ci`, `typecheck`, `lint`, `test`. Сборку проверяет Vercel, когда собирает превью.

## Деплой на Vercel

- Проект Vercel подключён к этому репозиторию на GitHub. Ветка `main` — продакшен (https://schr1.vercel.app), каждый pull request получает превью со своим адресом.
- Vercel собирает проект скриптом `vercel-build`: `payload migrate && next build`. Сначала к базе применяются миграции из `src/migrations`, потом идёт сборка.
- База Neon разведена по веткам: `production` — для продакшена, `preview` — для превью, `dev` — для работы на своём компьютере. `DATABASE_URI` в Vercel задан отдельно для окружений Production и Preview.
- Переменные окружения задаются в настройках проекта Vercel (Settings → Environment Variables). `BLOB_READ_WRITE_TOKEN` туда добавляется вручную. `SITE_INDEXING` читается при сборке, поэтому после его смены нужен новый деплой.
- Node.js на Vercel — 26 (`engines` в `package.json`).
- Если поменялась схема Payload: `npx payload migrate:create`, файл миграции — в тот же коммит, что и схема, и `npm run generate:types`.

## Где лежат тексты и фото

- Контент — в админке `/admin` (Payload), на двух языках: услуги, работы, вакансии, команда, отзывы, данные фирмы, часы работы, Impressum и Datenschutz, тексты главной и подписи шагов 3D-сцены. После сохранения в админке сайт обновляется сам.
- Фото — в разделе Media админки, у каждого обязательный alt, автор и источник. Файлы хранятся в Vercel Blob.
- Тексты интерфейса (меню, кнопки, подписи полей, пометка «Konzeptprojekt», плашка отпуска) — в [`messages/de.json`](messages/de.json) и [`messages/en.json`](messages/en.json).
- `npm run seed` ([`seed/content.ts`](seed/content.ts), фото из `seed/images/`) — только для первичного наполнения пустой базы. **На production не запускать:** seed возвращает демо-документам исходные значения и затирает правки, сделанные в админке. При `NODE_ENV=production` без `BLOB_READ_WRITE_TOKEN` seed останавливается сам, чтобы фото не остались только на локальном диске.

## Структура

| Папка | Что внутри |
|---|---|
| `src/app/(frontend)/[locale]/` | страницы сайта; `globals.css` рядом — Tailwind и токены дизайна |
| `src/app/(payload)/` | админка и API Payload; папку генерирует Payload, руками не править |
| `src/collections/`, `src/globals/` | схема данных Payload |
| `src/hooks/` | хуки Payload: обновление страниц после сохранения, запрет удалять фото, которые где-то используются |
| `src/migrations/` | миграции базы |
| `src/components/` | компоненты по страницам; `ui/` — общие элементы, `layout/` — шапка и подвал, `wardrobe/` — 3D-сцена |
| `src/lib/` | доступ к данным, Server Actions и схемы Zod форм, письма, SEO, разметка для Google |
| `src/i18n/` | настройки next-intl и переводы адресов страниц |
| `src/proxy.ts` | выбор языка по адресу |
| `public/textures/`, `public/images/` | текстуры 3D-сцены, логотип, картинка готового шкафа |
| `messages/` | тексты интерфейса на немецком и английском |
| `seed/` | демо-контент и его фото |
| `tests/unit/`, `tests/e2e/` | тесты Vitest и Playwright |
| `docs/` | бриф проекта и источники |
| `design/` | HTML-макет сайта |

## Источники фото, текстур и шрифтов

Авторы, ссылки и лицензии — в [`docs/credits.md`](docs/credits.md).

## Демо-режим

- Фирма вымышленная. В подвале и у форм стоит пометка «Konzeptprojekt – die Schreinerei Tannrieder ist ein fiktives Unternehmen.»
- Сайт закрыт от поисковиков: на продакшене `SITE_INDEXING` не равен `true`, поэтому на всех страницах `noindex, nofollow`, в ответах заголовок `X-Robots-Tag`, а `robots.txt` запрещает обход всего сайта.
- Телефон — номер, зарезервированный для фильмов и книг (089 99998 412), почта — на домене `.example`.
- Письма из форм уходят только автору проекта, заявки нигде не хранятся.
- На публичных страницах нет ни одной cookie, а браузер посетителя не обращается к чужим доменам: шрифты, фото и 3D отдаются с домена сайта.
