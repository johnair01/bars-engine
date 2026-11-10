# Local-first testing

Since 2026-11-04 Vercel builds production only. A pushed branch gets **no preview**, so every change to bars-engine
is started, tested and shown from the session that made it, before it is pushed. This page is the procedure for every
Claude working environment: a cloud session, a parallel workspace or worktree, and Remote Control on Wendell's Mac.

The short version:

```bash
scripts/local/dev.sh dev                 # local Postgres + this workspace's database + next dev, prints the URL
scripts/local/check.sh --build           # lint, types, vitest, and the production build, all on the local database
AS=test-admin scripts/local/dev.sh shot /board/council /mastering-allyship   # pictures for Wendell
scripts/local/dev.sh stop
```

## 1. How the app runs

| Part | What it is | Locally |
| --- | --- | --- |
| App | Next.js 16 (`next dev --webpack`), TypeScript, Tailwind | `scripts/local/dev.sh dev` |
| Database | PostgreSQL through Prisma 5 (`DATABASE_URL`; Accelerate `prisma+postgres://` in production) | one local server, one database per workspace |
| Sign-in | a `bars_player_id` cookie naming a `Player` row (`src/lib/auth.ts`); email + password through `Account.passwordHash` | seeded `admin@admin.local` / `password`, player id `test-admin` |
| Board | `/board/council` and `/board` wrap pages pushed from six-faces-council into a private Vercel Blob store; saves go to Postgres through `/api/board/*` | pages read from a six-faces-council checkout (`BOARD_CONTENT_DIR`); saves go to the local database |
| Python backend | `backend/` (FastAPI, hosted on Render) for agent features | not started; features that need it degrade or show their error |
| AI | OpenAI / Anthropic / AI Gateway keys, optional | used only if a key is in your `.env.local`; costs money, touches no live data |
| Outbound services | Resend and Gmail (email), Vercel Blob (uploads, board content), GitHub (board dispatch), Gumroad webhook secret, the pickup routine | **blanked** by the script so nothing leaves the machine |

`npm run build` is `build:game`, `build:understood`, `build:ontology-game`, `build:calrunia`, the route validator, the
registry, then `scripts/build-with-env.ts`, which runs `prisma migrate deploy` when a `DATABASE_URL` is set and then
`next build`.

## 2. What could touch live data, and what stops it

| Risk | Before | Now |
| --- | --- | --- |
| `npx vercel env pull` writes production's `DATABASE_URL` into `.env.local`; `npm run dev` then reads and writes the live database | silent | `src/lib/db.ts` refuses a non-local database in a dev server (`src/lib/local-db-guard.ts`) |
| `npm run build` on a laptop or sandbox runs `prisma migrate deploy` against whatever `DATABASE_URL` says | silent | `scripts/build-with-env.ts` skips the migration outside Vercel when the database is not local, and says so |
| `tsx scripts/with-env.ts ...` let `.env.local` override everything | overrides | under `scripts/local/dev.sh` (`BARS_LOCAL=1`) the local values win |
| Blob tokens, email keys, GitHub and routine tokens in `.env.local` | live | blanked by `scripts/local/dev.sh` unless `BARS_KEEP_SECRETS=1` |
| `npm run db:reset` | already refuses a non-local host (`scripts/db-reset-guard.ts`) | unchanged |
| The board page links to `https://bars-engine.vercel.app/...` | its data calls are already rewritten to the local origin (`src/app/board/shim.ts`) | plain links in the page still open production when clicked; that is navigation, not a write |

To use a remote database on purpose, for one command: `BARS_ALLOW_REMOTE_DB=1`. Vercel itself is never affected
(`VERCEL=1` there). Never point local tests at production to "see real data"; seed what the test needs instead.

Scripts that are production tools by name (`prod:snapshot`, `db:prod-reset`, `diagnose:prod-db`, `verify:prod-db`,
`env:pull:production`) are not part of local testing. A session does not run them unless Wendell asks for that step.

## 3. The local environment, step by step

`scripts/local/dev.sh` (bash 3.2 and up, so it runs on macOS as shipped):

1. **Postgres server.** It reuses the first that answers: `LOCAL_PG_URL`; a server it started before on port 54329;
   `postgres:postgres@127.0.0.1:5432`. Otherwise it starts one: the Debian cluster that Claude cloud sessions ship
   (PostgreSQL 16, `pg_ctlcluster`), a private cluster in `~/.bars-engine/pg` on a Mac with Homebrew or Postgres.app
   (no root, no service), or a `postgres:16` Docker container. If none exists it says how to install one.
2. **One database per workspace.** The name comes from the checkout's folder and path
   (`bars_<folder>_<hash>`), so two worktrees or two sessions never share data.
3. **Schema.** A new database is built from `prisma/schema.prisma` (`prisma migrate diff --from-empty`) and the
   migration history is recorded as applied (`scripts/local/baseline.mjs`). The migration chain cannot build an empty
   database yet (legacy `db push` gaps, `docs/PRISMA_MIGRATE_STRATEGY.md` Path B). After that, every `up` runs
   `prisma migrate deploy`, so a branch's new migration is applied and tested the way production will apply it.
4. **Seed.** A new database gets `prisma/seed.ts`: roles, nations, archetypes, the `PUBLIC` invite and the admin
   player. `RESEED=1 scripts/local/dev.sh up` seeds again; `scripts/local/dev.sh reset-db` starts over. Feature
   seeds run inside the local environment: `scripts/local/dev.sh run -- npm run seed:bb-campaign`.
5. **Port.** Each workspace has its own default port between 3100 and 3899 (from its path). If that port is taken,
   by another session or anything else, the script moves up to the next free one. `PORT=3456` picks a start point.
6. **Environment.** The command's own environment carries the local `DATABASE_URL`, blank values for the outbound
   keys above, `NEXT_PUBLIC_APP_URL=http://localhost:<port>`, `BOARD_OWNER_PLAYER_ID=test-admin`, and
   `BOARD_CONTENT_DIR` when a six-faces-council checkout sits next to bars-engine (or `COUNCIL_DIR=` names it).
   Values set this way win over `.env` and `.env.local` in Next.js, Prisma and dotenv, so a pulled `.env.local`
   can stay on disk for its AI keys without steering the database.
7. **Server.** `dev` starts `next dev` in the background, waits until it answers, and prints the URL. State lives in
   `.local-dev/` (git-ignored): `url`, `port`, `dev.log`, `dev.pid`. `status` and `stop` read it. `dev --fg` runs in
   the foreground for a person at a terminal.

### Signing in

- In a browser: `/login` with `admin@admin.local` / `password`.
- For pictures: `AS=test-admin scripts/local/dev.sh shot ...` sets the cookie in the screenshot browser.
- For a whole session: `BARS_LOCAL_AS=test-admin scripts/local/dev.sh dev` makes every request that player
  (`DEV_PLAYER_ID`, development only). Leave it off to test signed-out flows.
- The Council Board answers only its owner; locally the owner is `test-admin`, so sign in as `test-admin` to open it.

## 4. Each environment

### Claude cloud session (claude.ai/code, project threads)

- Node 22, PostgreSQL 16 and Playwright's Chromium are installed; Docker's client is present but its daemon is not
  running. `scripts/local/dev.sh dev` starts the cluster itself (the container runs as root).
- **`localhost` is the container, not Wendell's computer.** A cloud session has no port forwarding to his browser, so
  he cannot open the URL it prints. The session tests the running app itself (Playwright, `curl`) and shows him
  pictures: section 5.
- Parallel threads each run in their own container, so ports and databases never collide there; the per-workspace
  port and database matter when several worktrees share one machine.
- The container is reclaimed when the session ends; the local database goes with it. Nothing to clean up.

### Parallel workspaces and worktrees on one machine

Each checkout gets its own database and its own default port automatically. `scripts/local/dev.sh status` in a
checkout says which. Two servers can run at once; a port that is taken moves the second up.

### Remote Control on Wendell's Mac

- The Remote Control session runs on his Mac, so **the printed `http://localhost:<port>` opens in his own browser**.
  The session tells him the URL in its reply.
- First run needs a Postgres: `brew install postgresql@16` (the script then makes a private cluster in
  `~/.bars-engine/pg`; no background service is installed). Postgres.app or Docker Desktop work too.
- Run from the bars-engine checkout on the Mac: `scripts/local/dev.sh dev`. To stop: `scripts/local/dev.sh stop`.
- Not yet verified on the Mac itself (2026-11-04): the first Remote Control session that runs it records the result
  here.

### Cowork folder access

Folder access (`device_bash`) runs in a Linux VM on his machine, not on macOS, and cannot open ports to his browser.
Use it to read or edit files, not to run the app.

## 5. Showing Wendell a change without a preview

He looks at a change in one of three ways, in this order:

1. **Pictures from the session (default for a cloud session).** With the server running:
   ```bash
   OUT=/mnt/project-files/looks/<strand>-<n> AS=test-admin scripts/local/dev.sh shot /the/page /another/page
   ```
   Each page is taken at phone width (390) and desktop width (1280), at 2x. `FULL=1` takes the whole page;
   `WAIT=4000` waits longer for 3D scenes; `WIDTHS=390` takes one width. The command prints each page's HTTP status
   and any page errors, and exits non-zero if a page failed, so a broken page is caught before he sees it. Read the
   pictures yourself first (check-before-he-sees-it). Then attach them to the thread reply, or carry them into a look
   row the usual way (six-faces-council `docs/stills-round.md`, `docs/merging.md` "A look row is checked"): a look's
   Open it shows its stills through `/board/look`, which needs no preview.
2. **The app on his Mac (Remote Control).** When he wants to click through it himself, a Remote Control session
   starts the branch on his Mac and replies with the `http://localhost:<port>` URL.
3. **Production, after the daily deploy.** Once the change ships (section 7) it is on bars-engine.vercel.app.

A look or board card must not carry a Vercel preview link any more: none will be built.

## 6. Before you push

```bash
scripts/local/check.sh            # npm run check (Prisma generate, verifiers, eslint, tsc) + npm run test:vitest
scripts/local/check.sh --build    # the same, then npm run build on the local database
```

The Vercel preview build used to be the build check for merging. **`scripts/local/check.sh --build` passing is
that check now.** A pull request's "How I checked it" names the command and its result, the pages it opened, and the
pictures it took. Also run the narrow `npm run test:<area>` scripts for what you changed, through
`scripts/local/dev.sh run --` when they need the database.

Failures that already exist on main are not yours to fix in an unrelated change. As of 2026-11-04:
`src/lib/__tests__/vitest-include-registration.test.ts` (seven suites not registered in `vitest.config.ts`) and
`src/lib/between/__tests__/land-place.test.ts`. Name them in the report as pre-existing.

Vercel runs Node 24; the cloud sandbox has Node 22. A difference between them is rare; if a build passes locally and
fails on Vercel, that is the first thing to check.

### The look check

`scripts/local/look-check.mjs` renders the Between's hollow headless (chromium with software WebGL, three.js from the CDN) at
a fixed camera and size, then compares two things with `scripts/local/look/baseline.json`: the look dataset
(`public/between/look-data.js`: ramp, palette and light budget, naming the entry that moved) and the frame's luminance at the
10th, 40th, 70th and 95th percentiles (the ramp is the only part held against the frame; the palette and light budget are
held as data). `check.sh` runs it as the `look` step only when the branch touches `public/between/`, `public/calrunia/` or
`scripts/local/look`, which keeps other lanes' push loops unchanged (`LOOK_CHECK=1` forces it, `LOOK_CHECK=0` skips it).
It skips, saying why, when Playwright, chromium or the CDN is unavailable. When a round moves the look on purpose, refresh
`look-data.js` from the council's `look.json`, run `node scripts/local/look-check.mjs --update`, and cite the new look hash
(`LOOK_HASH`) in the pull request. Spec: six-faces-council `.specify/specs/between-look-data`.

## 7. Shipping: one production deploy a day

Production behaviour is unchanged: **every push to `main` builds production.** So the number of merges to `main` is
the number of production builds. To ship about once a day, merges are batched:

1. A thread finishes its pull request with `scripts/local/check.sh --build` green and its looks answered, marks it
   ready for review, and labels it `ship-next`. It does not merge it.
2. Once a day, one shipping session (Sonnet) takes every open `ship-next` pull request, oldest first, and merges them
   into a branch `ship/<YYYY-MM-DD>` cut from `main`. Branch builds are off, so this costs nothing on Vercel. A pull
   request that conflicts or breaks the batch is left out, keeps its label, and its thread is told why.
3. The shipping session runs `scripts/local/check.sh --build` on `ship/<date>` and takes pictures of the day's
   changed pages.
4. It merges `ship/<date>` into `main` in one merge commit: **one production build** for the day. Each included pull
   request then shows as merged on GitHub, because its commits are in `main`.
5. It checks bars-engine.vercel.app once the deployment is ready (the Vercel MCP or `get_deployment`), and posts a
   one-line ship note with the list. If production is broken, Vercel's Instant Rollback to the previous production
   deployment is the fix while the cause is found.

Urgent fixes (production is down, a payment or sign-in is broken) merge straight to `main` as before.

Wendell ruled this on 2026-11-04 (board `lf-daily-ship`, answer A). It replaces threads merging their own pull
requests in bars-engine. A manual merge to `main` stays for urgent fixes only. The council repo's `docs/merging.md`
("bars-engine ships once a day") holds the same rule.

Create the label once: `ship-next` (colour `0e8a16`, "Ready: merges in the next daily ship").

A shared `staging` branch with its own Vercel environment can be added later without changing any of this: the
shipping session would merge `ship/<date>` into `staging` first, look, then into `main`.

### When a change needs Vercel's hosted environment

Some things only show on Vercel: edge or middleware behaviour, `vercel.json` crons, Blob or other Vercel storage,
environment variables that exist only there, domain or header behaviour. Such a change is flagged in its pull request
("needs hosted check: <why>"), and the options are:

1. **Ship it in the daily batch and check production right after**, with Instant Rollback ready. Best when the change
   is small and reversible.
2. **One manual preview**, on Wendell's say-so for that pull request: `npx vercel deploy` from the branch (or the
   Vercel MCP `create_deployment`). It is a pre-production deployment, kept one week. Never routine.
3. **The staging branch**, once it exists.
