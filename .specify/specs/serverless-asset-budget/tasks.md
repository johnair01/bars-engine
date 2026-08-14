# Tasks: Serverless Asset Budget

## Phase 0 — Seatbelt

- [ ] Set `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` in Vercel → Settings → Environment Variables (Production, Preview, Development)
- [ ] Redeploy so it takes effect (env changes apply only to new builds)
- [ ] Document the variable in `docs/ENV_AND_VERCEL.md`

## Phase 1 — Remove computed-path reads (P0)

- [ ] Record the baseline: run `npm run build`, note the largest function size from the build output
- [ ] Grep for client-side fetches of `/registry.json`, `/oracle/deck.json`, `/allyship-deck/allyship-deck.json` — decide per file whether a `public/` copy must stay
- [ ] Move `public/oracle/deck.json` → `src/data/`, add module wrapper, update `src/lib/valkyrie-party/service.ts`
- [ ] Move `public/registry.json` → `src/data/`, update `src/app/api/registry/route.ts`
- [ ] Move `public/allyship-deck/allyship-deck.json` → `src/data/`, update `src/app/campaign/[ref]/needs/page.tsx`
- [ ] Update the three test files that read these via `process.cwd()` (`superpower-quality`, `superpower-decks`, `card-visuals`)
- [ ] Replace the `public/sprites/parts/` directory scan in `src/actions/admin.ts` with a committed manifest — or defer and exclude `public/sprites/**`, stating which in the PR
- [ ] Add `outputFileTracingExcludes: { '/**': ['public/**'] }` to `next.config.ts`
- [ ] `npm run build` — confirm largest function is under 100MB; put before/after numbers in the PR description
- [ ] `npm run check` — lint + type-check
- [ ] Open PR, confirm the preview deploy succeeds

## Phase 2 — One write path, no silent fallback

- [ ] Add `src/lib/storage/put-asset.ts` with `putAsset(scope, key, body, opts)`; throw a descriptive error when `BLOB_READ_WRITE_TOKEN` is unset
- [ ] Convert `src/actions/deliverables.ts` — remove `UPLOAD_DIR` and the local-write branch
- [ ] Convert `src/actions/books.ts` — same; keep `sourcePdfUrl` writes working
- [ ] Convert `src/actions/assets.ts` — same; keep the deprecated `uploadBarAttachment` functional for scripts
- [ ] Add a Blob path to sprite upload in `src/actions/admin.ts`; remove `fs.writeFileSync` into `public/sprites/parts/`
- [ ] Audit consumers of `sourcePdfUrl`, deliverable `fileUrl`, and sprite paths for assumptions about a leading `/uploads/`
- [ ] Note the local-dev behavior change (uploads now require a Blob token) in `docs/DEVELOPER_ONBOARDING.md`
- [ ] `npm run build` && `npm run check`

## Phase 3 — Move bulk media

- [ ] Upload `public/card-art/` (35MB) to Blob; resolve via `src/lib/ui/card-art-registry.ts`
- [ ] Upload `public/oracle/` (108MB) to Blob
- [ ] Add Blob host to `images.remotePatterns` in `next.config.ts`
- [ ] Write `scripts/` one-off to rewrite any stored asset URLs — no hand-edited rows
- [ ] Delete migrated files from `public/` in a separate commit
- [ ] Build the `cert-asset-cdn-v1` verification quest (Twine passages + seed script + `seed:cert:asset-cdn` npm script)
- [ ] Run `cert-asset-cdn-v1` against a preview deploy — not local, which serves `public/` directly and would mask a broken path
- [ ] Document "new art goes to Blob, not `public/`" in `docs/DEVELOPER_ONBOARDING.md`
- [ ] `npm run build` && `npm run check`
