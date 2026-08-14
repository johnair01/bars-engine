# Plan: Serverless Asset Budget

## Strategy

Three independently shippable phases, ordered so the urgent one carries no risk from the others. Phase 1 alone takes the largest function from ~250MB to under 100MB. Phases 2 and 3 are correctness and hygiene, and can land on their own schedule.

Do **not** bundle these into one PR. Phase 1 needs to be revertable without dragging an upload refactor with it.

## Phase 0 — Seatbelt (no code)

Set `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` in Vercel → Project → Settings → Environment Variables (Production, Preview, Development), then redeploy. Takes effect only on a new build. This buys headroom while Phase 1 is written; it is not a fix and does not close this spec.

## Phase 1 — Remove computed-path reads

**Files touched**

| File | Change |
|------|--------|
| `src/data/oracle-deck.json` + `.ts` | New — moved from `public/oracle/deck.json` |
| `src/data/registry.json` + `.ts` | New — moved from `public/registry.json` |
| `src/data/allyship-deck.json` + `.ts` | New — moved from `public/allyship-deck/allyship-deck.json` |
| `src/lib/valkyrie-party/service.ts` | Drop `readFile`; import the module |
| `src/app/api/registry/route.ts` | Drop `readFile`; import the module |
| `src/app/campaign/[ref]/needs/page.tsx` | Drop `readFile`; import the module |
| `src/actions/admin.ts` | Replace `public/sprites/parts/` directory scan with a committed manifest |
| `next.config.ts` | Add `outputFileTracingExcludes` |

**Watch for**: three test files read the same JSON via `process.cwd()` —
`src/lib/technique-library/__tests__/superpower-quality.test.ts`,
`superpower-decks.test.ts`, and `src/lib/allyship-deck/__tests__/card-visuals.test.ts`.
Point them at the new module. Tests are not bundled, so they are not the cause, but leaving them reading a deleted path breaks the suite.

**Decide before writing code**: whether any of the three JSON files must *also* remain fetchable by the browser from `/…`. If a client component fetches `/registry.json`, keep a copy in `public/` and import the `src/data/` one server-side — the duplication is a few hundred KB and removes the tracing problem. Grep for client-side `fetch('/registry.json')`-style calls first.

**Sprite manifest**: `admin.ts` scans `public/sprites/parts/<layer>/` to list what exists. Simplest correct replacement is a generated `src/data/sprite-manifest.json` written by an existing sprite script, so the admin screen reads data instead of a directory. If that is more than a small change, defer FR2 to Phase 2 and exclude only `public/sprites/**` from tracing in the meantime — but say so in the PR rather than leaving it silent.

**Verification**: `npm run build` prints per-function sizes. Capture the largest before and after.

## Phase 2 — One write path

Add `src/lib/storage/put-asset.ts` exporting `putAsset(scope, key, body, opts)`. It wraps `put` from `@vercel/blob`, throws a descriptive error when `BLOB_READ_WRITE_TOKEN` is absent, and never touches the filesystem.

Then convert, in this order (smallest blast radius first):

1. `src/actions/deliverables.ts` — already branches on the token; delete the else.
2. `src/actions/books.ts` — same shape; delete `UPLOAD_DIR` and the `mkdir`/`writeFile` branch.
3. `src/actions/assets.ts` — same; note the deprecated `uploadBarAttachment` still needs to work for scripts.
4. `src/actions/admin.ts` sprite upload — the only one with no Blob path today; this is new behavior, not a swap.

**Risk**: local development without a Blob token currently "works" via the filesystem fallback and will start failing. That is the intended outcome — it matches what the API routes already do — but call it out in the PR and in onboarding docs so it does not read as a regression.

## Phase 3 — Move bulk media

`public/oracle/` (108MB) and `public/card-art/` (35MB) are 91% of `public/`. Upload to Blob, resolve through `src/lib/ui/card-art-registry.ts`, add `remotePatterns` to `next.config.ts`.

Sequence: new art to Blob first, then backfill existing art, then delete from `public/` in a separate commit so a revert is cheap. Ship the `cert-asset-cdn-v1` verification quest with this phase.

**Note**: deleting the files does not shrink git history. That is acceptable — the goal is deploy health, not repo size. Only consider history rewriting if clone times become a real complaint.

## Risks

| Risk | Mitigation |
|------|------------|
| A client component fetches one of the moved JSON files | Grep before moving; keep a `public/` copy if so |
| Tracing exclusion hides a genuine runtime read | Fix the reads first; the exclusion is a guard, not the fix |
| Blob URLs break stored `/uploads/...` references | Phase 2 FR9 audits consumers; Phase 3 uses a script, not hand edits |
| Local dev breaks without a Blob token | Intended; document it |
| Phase 3 breaks art silently in production | Verification quest walks the real surfaces on a preview deploy |

## Verification

- `npm run build` — largest function under 100MB after Phase 1
- `npm run check` — lint + type-check, each phase
- Preview deploy succeeds
- `cert-asset-cdn-v1` completes on preview (Phase 3)
