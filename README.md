# QuizDeck

A personal study app for turning question banks into quick practice rounds.
Organise quizzes into **Libraries → Subjects → Questions**, import Blooket-style
CSV files, and practise with optional shuffling and a countdown timer.

Built with Next.js 16 (App Router), Auth.js v5, Prisma + PostgreSQL, Tailwind
CSS v4, and dnd-kit.

## Features

- **Google sign-in** with an email allowlist.
- **Libraries and subjects** with full create, rename, and delete.
- **Questions** with 2–4 answers, one or more correct answers, and a per-question
  time limit (5–300 seconds). Create, edit, delete, and drag to reorder.
- **CSV import** for Blooket exports: tolerant header detection, per-row
  validation, a read-only preview with include/exclude checkboxes, and duplicate
  subject handling (replace, append, or create a copy).
- **Practice sessions** that shuffle questions and/or answers, use each question's
  timer (or run untimed), auto-advance after a correct answer, and wait for you
  after a wrong answer or timeout. Each round ends with accuracy stats and a
  review of missed questions.
- **Private data:** every library belongs to one user; queries are scoped to the
  signed-in owner.

## Requirements

- Node.js 22+ (developed on Node 26)
- npm
- PostgreSQL 14+ (local Docker setup included) or a hosted PostgreSQL database
- A Google Cloud OAuth client (production / real sign-in)
- Optional: `openssl` to generate `AUTH_SECRET`

## Local setup

```bash
npm install
docker compose up -d db
cp .env.example .env
cp .env.example .env.local
```

Edit `.env` and `.env.local`:

```dotenv
DATABASE_URL="postgresql://quizdeck:quizdeck@localhost:5432/quizdeck?schema=public"
DIRECT_URL="postgresql://quizdeck:quizdeck@localhost:5432/quizdeck?schema=public"
AUTH_SECRET="<output of: openssl rand -base64 32>"
```

`compose.yaml` starts PostgreSQL 17 on `127.0.0.1:5432` with the database,
user, and password `quizdeck`. Override `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`, or `POSTGRES_PORT` in `.env` if needed — and keep
`DATABASE_URL` in sync.

Prisma CLI reads **`.env` only**; Next.js reads both `.env` and `.env.local`.
Keep `DATABASE_URL` in `.env` so migrations and the app agree on the database.

Apply the schema, then start the app:

```bash
npx prisma migrate dev
npm run dev
```

Open <http://localhost:3000> and sign in with Google. Register the local
callback URI first (see below). Without `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET`, the login page shows a configuration notice.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app; on Neon use the `-pooler` host |
| `DIRECT_URL` | Yes | Direct/unpooled PostgreSQL connection used by Prisma CLI for migrations |
| `AUTH_SECRET` | Yes | Auth.js signing secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | For Google sign-in | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | For Google sign-in | Google OAuth client secret |
| `ALLOWED_EMAILS` | Yes in production | Comma-separated emails allowed to sign in |

`compose.yaml` also reads these optional variables (defaults in parentheses):
`POSTGRES_USER` (`quizdeck`), `POSTGRES_PASSWORD` (`quizdeck`), `POSTGRES_DB`
(`quizdeck`), and `POSTGRES_PORT` (`5432`). Only Docker Compose uses them; if you
change one, update `DATABASE_URL` to match.

For a hosted PostgreSQL that requires TLS, append `&sslmode=require` to both
URLs. URL-encode special characters in the password (for example `@` becomes
`%40`).

## Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** of type *Web application*.
2. Add an authorised redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.example/api/auth/callback/google`
3. Put the credentials in `.env.local` (and in the server environment when
   deploying):

   ```dotenv
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   ```

The Google button stays hidden until both variables are present.

### Allowlist

Set `ALLOWED_EMAILS` to a comma-separated list of addresses that may sign in:

```dotenv
ALLOWED_EMAILS="you@gmail.com,study-buddy@gmail.com"
```

A signed-in account that is not on the list is rejected. In production the
allowlist is required; when it is empty in development, any email is allowed so
local testing stays easy.

## CSV import

The importer accepts Blooket exports and similar files. A typical file looks like
this (the first row may be blank and headers may span two lines):

```csv
,,,,,,,
Question #,Question Text,Answer 1,Answer 2,Answer 3 (Optional),Answer 4 (Optional),Time Limit (sec) (Max: 300 Seconds),Correct Answer(s) (Only Include Answer #)
1,What is 2 + 2?,1,2,3,4,40,2
2,Which of these are even?,2,3,4,5,30,"1,3"
```

Rules:

- The header row is detected automatically, including multi-line Blooket headers.
- Answer 3 and 4 are optional; answers must be filled in order without gaps.
- `Correct Answer(s)` uses 1-based answer numbers, e.g. `2` or `1,3`.
- Time limits are optional and default to 40 seconds; values above 300 are capped.
- Rows with a number but no text, answers, or correct token are treated as blank
  placeholders and skipped (common at the end of Blooket exports).
- Invalid rows are shown with errors and are not imported.
- Nothing is saved until you review the preview and press **Import**.

A downloadable template is available from the import dialog.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:migrate` | Create/apply a Prisma migration in development |
| `npm run db:push` | Push the schema without a migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:up` | Start the local PostgreSQL container |
| `npm run db:down` | Stop the local PostgreSQL container |

## Project structure

```
prisma/
  schema.prisma          User, Library, Subject, Question, Answer
  migrations/            PostgreSQL migrations
src/
  actions/               Server actions for auth, libraries, subjects, questions, import
  app/
    (app)/               Signed-in layout: libraries and subject pages
    (focus)/play/        Full-screen practice route
    api/auth/            Auth.js route handler
    login/               Sign-in page
  components/            UI, import dialog, question editor/list, quiz player
  lib/                   Auth, Prisma client, CSV parser, validation, helpers
CONTEXT.md               Domain glossary (Library, Subject, Question, Quiz session)
```

## Practice behaviour

- Picking an answer on a single-answer question submits it immediately.
- Multi-answer questions require every correct answer and no incorrect ones, then
  submit with **Check answer**.
- A correct answer is highlighted and the next question loads automatically after
  a short pause.
- A wrong answer or timeout reveals the correct answers and waits for **Continue**.
- Turning off the countdown timer gives untimed practice; the per-question time
  limit is still used when the timer is on.

## Tests

```bash
npm run test
```

Vitest covers the CSV parser: Blooket headers, multi-answer tokens, validation
errors, time-limit capping, placeholder rows, missing headers, template
round-trip, and file-name handling.

## Deploying to Vercel + Neon

This is a good fit: the app is a standard Next.js App Router project and already
uses PostgreSQL. Only the connection setup changes.

1. Create a project and database on [Neon](https://neon.tech), then copy both
   connection strings from **Connect**:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL` for the app.
   - **Direct** (unpooled, no `-pooler`) → `DIRECT_URL` for Prisma migrations.
2. Add these environment variables to the Vercel project (Production and
   Preview as needed):

   ```dotenv
   DATABASE_URL="postgresql://...@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   AUTH_SECRET="..."
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   ALLOWED_EMAILS="you@gmail.com"
   ```

   For a custom domain, also set `AUTH_URL="https://your-domain.com"`.

3. Apply the schema to Neon **before** deploying. From your machine:

   ```bash
   DATABASE_URL="<neon-pooled-url>" \
   DIRECT_URL="<neon-direct-url>" \
   npx prisma migrate deploy
   ```

4. Move the existing questions. The simplest option is to create the library in
   the deployed app and import `An3.csv` again. To copy the exact local data:

   ```bash
   cd /home/andev/dev/clone-blooket
   docker compose exec -T db pg_dump -U quizdeck -d quizdeck \
     --data-only --no-owner --no-privileges \
     --exclude-table=_prisma_migrations > /tmp/quizdeck-data.sql

   docker run --rm -i postgres:17-alpine \
     psql "<neon-direct-url>" -f - < /tmp/quizdeck-data.sql
   ```

5. Add `https://your-domain.com/api/auth/callback/google` to the Google OAuth
   client, then deploy. The default Vercel build (`npm run build`) already runs
   `prisma generate`; do not run migrations as part of every build.

Use the pooled URL at runtime because Vercel scales functions and each instance
would otherwise open its own direct Neon connection. Keep the direct URL only
for migrations and administrative commands.

## Deploying to a VPS (not set up yet)

The app runs as a single Node process backed by PostgreSQL. A typical setup
would be:

1. Install Node.js and PostgreSQL on the VPS, or run the included database
   container with `docker compose up -d db` (it binds to `127.0.0.1` only).
2. Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`, and `ALLOWED_EMAILS` in the server environment.
3. Build with `npm ci && npx prisma migrate deploy && npm run build`.
4. Run `npm run start` behind a reverse proxy (Caddy or nginx) with HTTPS.
5. Back up the database regularly with `pg_dump`.
6. Add the production callback URL to the Google OAuth client.

The compose file only covers PostgreSQL. Docker/Caddy artifacts for the app
itself are intentionally not included yet; add them when the deployment target
is chosen.

## Notes

- There is no quiz history or resume feature in this version; each practice round
  is self-contained and ends with a summary.
- `next dev` regenerates the note at the top of `AGENTS.md`; leaving it in place
  keeps the working tree clean.
