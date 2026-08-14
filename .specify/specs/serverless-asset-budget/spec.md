# Spec: Serverless Asset Budget — stop tracing `public/` into every function

## Purpose

Keep Vercel Functions small and deploys reliable by ensuring server code never references `public/` through a computed path, and by finishing the Vercel Blob migration that is already most of the way done.

**Problem**: On 2026-08-13 a preview deploy failed with:

```
The Vercel Function "admin/books/[id]/import-gameplay" is 250.04mb
uncompressed which exceeds the maximum uncompressed size limit of 250mb.
```

The build compiled cleanly; it failed while packaging functions. The function was **0.04MB** over. It had been sitting at roughly **97%** of the ceiling for some time, so any few megabytes of new assets would have tipped it — a 6.9MB cover/PDF addition happened to be the one that did.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Root cause

Next.js traces server dependencies with `@vercel/nft`. Literal imports resolve to exactly one file. A path **assembled at runtime** cannot be statically resolved, so tracing conservatively includes the entire directory. Four server-side sites do this:

| Site | Reads | Drags in |
|------|-------|----------|
| [`src/lib/valkyrie-party/service.ts:42`](../../../src/lib/valkyrie-party/service.ts) | `public/oracle/deck.json` (164KB) | `public/oracle/` — **108MB** |
| [`src/app/api/registry/route.ts:70`](../../../src/app/api/registry/route.ts) | `public/registry.json` (256KB) | root of `public/` |
| [`src/app/campaign/[ref]/needs/page.tsx:20`](../../../src/app/campaign/[ref]/needs/page.tsx) | `public/allyship-deck/allyship-deck.json` (140KB) | `public/allyship-deck/` |
| [`src/actions/admin.ts:687,729`](../../../src/actions/admin.ts) | `public/sprites/parts/` listing | `public/sprites/` |

All four use the shape `path.join(process.cwd(), 'public', …)`.

**The ratio**: server code genuinely needs about **560KB** out of `public/`. It receives **163MB** — roughly **290 bytes bundled per byte used**. `public/card-art/` (35MB) is pure browser-delivered art that never needs to be inside a function at all.

`public/` being large is not itself a defect. A well-behaved Next.js app serves `public/` from the CDN and never bundles it. This app bundles it because of how four files read from it.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Server-read data files | Move out of `public/` into `src/data/` and `import` them. A literal import traces one file. This removes the cause rather than masking it. |
| `outputFileTracingExcludes` | Add it **after** the reads are fixed, as a guard so a future `process.cwd()` read cannot silently re-inflate every function. Not the primary fix. |
| Storage provider | **Already decided — Vercel Blob.** `@vercel/blob@^2.3.1` is a dependency and is used across 15 files. No provider evaluation is needed; the work is consistency, not selection. |
| Local-FS upload fallbacks | Remove. `assets.ts`, `books.ts`, and `deliverables.ts` silently fall back to writing `public/uploads/` when `BLOB_READ_WRITE_TOKEN` is absent. On Vercel the filesystem is read-only outside `/tmp`, so the fallback cannot succeed there — it converts a clear config error into a confusing runtime one. The API routes already fail loudly with a good message; actions should match. |
| Sprite uploads | `admin.ts` writes sprites with `fs.writeFileSync` into `public/sprites/parts/` and has **no** Blob path at all. It is the one uploader the migration missed. |
| Large-functions opt-in | `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` is a **seatbelt, not a fix**. Set it so the ceiling cannot break a deploy mid-remediation, and keep it afterwards as headroom. |
| Bulk media migration | Deferred to Phase 3 and decoupled. Phases 1–2 restore a healthy budget on their own; migrating 143MB of art is then a calm choice rather than an emergency. |

## Conceptual Model

Infrastructure work with no WHO/WHAT/WHERE surface — no quests, nations, archetypes, or domains change. Recorded here so a reader knows the section was considered, not skipped. The only player-visible dimension appears in Phase 3, where card art changes origin; that is covered by the verification quest.

## API Contracts (API-First)

### Phase 2 — uniform asset write path

Existing Blob usage is correct but duplicated per call site with divergent fallback behavior. Introduce one adapter and route all writers through it.

**Input**: file bytes + a logical key
**Output**: a stable public URL

```ts
// src/lib/storage/put-asset.ts
export type AssetScope = 'assets' | 'books' | 'deliverables' | 'sprites'

export async function putAsset(
  scope: AssetScope,
  key: string,              // e.g. `${book.id}.pdf`, `head/warrior.png`
  body: Buffer | Blob,
  opts?: { contentType?: string }
): Promise<{ url: string }>
```

- Throws a descriptive error when `BLOB_READ_WRITE_TOKEN` is unset. **No silent local-filesystem fallback.**
- Local development without a token gets the same clear error, matching `/api/assets/upload`'s existing message ("…Add it in Vercel Dashboard → Storage → Blob").
- **Server Action** callers (`assets.ts`, `books.ts`, `deliverables.ts`, `admin.ts`) return `{ success, error }` as they do today.

### Phase 1 — data module

```ts
// src/data/oracle-deck.ts  (and siblings)
import deck from './oracle-deck.json'
export const ORACLE_DECK = deck
```

No route or action signature changes; `getBarnSnapshot`-style consumers keep their contracts.

## User Stories

### P1: Deploys stop failing for reasons unrelated to the change

**As a developer**, I want the function bundle to contain only what the server actually needs, so an unrelated asset commit cannot fail a deploy.

**Acceptance**: after Phase 1, the largest function reports **under 100MB** in the build output (from ~250MB); `npm run build` and a preview deploy both succeed.

### P2: Uploads fail loudly or not at all

**As an admin uploading a book, asset, deliverable, or sprite**, I want a clear error when storage is misconfigured, so I am never left with an upload that appeared to work but wrote nowhere.

**Acceptance**: with `BLOB_READ_WRITE_TOKEN` unset, every upload surface returns the same descriptive configuration error; none attempt a `public/` write. With the token set, all four scopes write to Blob and persist a Blob URL.

### P3: The asset library can grow without threatening the build

**As the project accumulates card art and oracle imagery**, I want adding art to be routine, so contributors never have to think about a function ceiling.

**Acceptance**: after Phase 3, `public/` holds only small, genuinely-static files; adding art does not change function size.

## Functional Requirements

### Phase 1 — Remove computed-path reads (unblocks deploys)

- **FR1**: Move `public/oracle/deck.json`, `public/registry.json`, and `public/allyship-deck/allyship-deck.json` into `src/data/`, imported literally. Delete the `readFile(path.join(process.cwd(), …))` calls at the four sites.
- **FR2**: Replace the `public/sprites/parts/` directory listing in `admin.ts` with a committed manifest (or a Blob listing once Phase 2 lands) so no directory is scanned from `process.cwd()`.
- **FR3**: If any file must remain readable from disk at runtime, reference it by a **literal** path so tracing resolves exactly that file.
- **FR4**: Add to `next.config.ts`:
  ```ts
  outputFileTracingExcludes: {
    '/**': ['public/**'],
  }
  ```
- **FR5**: Build output MUST show the largest function under 100MB. Record the before/after number in the PR.

### Phase 2 — One write path, no silent fallback

- **FR6**: Add `src/lib/storage/put-asset.ts` per the contract above.
- **FR7**: Route `assets.ts`, `books.ts`, `deliverables.ts` through `putAsset`; delete their `UPLOAD_DIR` constants and `public/uploads` branches.
- **FR8**: Give sprite upload in `admin.ts` a Blob path via `putAsset('sprites', …)`; remove `fs.writeFileSync` into `public/sprites/parts/`.
- **FR9**: Persisted URLs (`sourcePdfUrl`, deliverable `fileUrl`, asset URLs, sprite paths) MUST accept absolute Blob URLs. Confirm no consumer assumes a leading `/uploads/`.

### Phase 3 — Move bulk media out of the repo

- **FR10**: Migrate `public/oracle/` (108MB) and `public/card-art/` (35MB) to Blob; resolve via the existing [`card-art-registry.ts`](../../../src/lib/ui/card-art-registry.ts).
- **FR11**: Add `remotePatterns` for the Blob host so `next/image` keeps optimizing.
- **FR12**: Document in [`docs/DEVELOPER_ONBOARDING.md`](../../../docs/DEVELOPER_ONBOARDING.md) that new art goes to Blob, not `public/`.

## Non-Functional Requirements

- No change to any player-visible URL in Phases 1–2.
- Phase 1 must be independently shippable and independently revertable.
- Dual-track: none of this requires a language model.
- Sprite/art rendering must be verified on a real preview deploy, not only locally, since local dev serves `public/` directly and will mask a broken Blob path.

## Persisted data & Prisma

**No schema change expected.** URL fields (`Book.sourcePdfUrl`, deliverable `fileUrl`, asset records) are already strings holding either a `/uploads/...` path or a Blob URL. Phase 3 may warrant a **data** migration (rewriting stored paths), not a schema migration.

| Check | Done |
|-------|------|
| Prisma models/enums/fields named in Design Decisions or API Contracts | n/a — no schema change |
| `tasks.md` includes migration + commit steps | n/a |
| Verification: `npm run check` | see tasks.md |
| Human glanced at new `migration.sql` | n/a |

If Phase 3 rewrites stored URLs, add a one-off script under `scripts/` — do **not** hand-edit rows.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Filesystem | Vercel Blob for all writes; **no `public/` writes in serverless** (already the documented standard in [spec-template.md](../../spec-template.md) — this spec brings the code into line with it) |
| AI calls | None in scope |
| Request body | Unchanged; large uploads already use the client-upload route to avoid `FUNCTION_PAYLOAD_TOO_LARGE` |
| Env | `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` and `BLOB_READ_WRITE_TOKEN` — document both in [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md) |

## Verification Quest (Phase 3 only)

Phases 1–2 change no player-visible behavior and need no quest. Phase 3 changes where every card image comes from, which is user-facing and worth certifying.

- **ID**: `cert-asset-cdn-v1`
- **Steps**:
  1. Open `/wiki/grid-deck` — confirm card art renders.
  2. Open a card detail — confirm full-size art renders.
  3. Open `/valkyrie-party/altar` — confirm oracle imagery renders.
  4. Upload a sprite in `/admin/avatars/assets` — confirm it appears without a redeploy.
  5. Final passage (no link) mints the reward.
- **Narrative framing**: preparing the deck art for the launch party — the cards have to look right when guests draw them.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Dependencies

- None blocking. Phase 1 is self-contained.
- Phase 3 depends on Phase 2's `putAsset` adapter.

## References

- Failed deploy: `9TgS983ZE7sGTja7PaGk9CwAoNMb` (PR #194, commit `abe33b9`); remediated by cover downsizing in `c540dd9`, merged as `c02b2c4`.
- [next.config.ts](../../../next.config.ts)
- [Vercel — troubleshooting the 250MB function limit](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit)
- [next.js#68160 — public folder included in the serverless bundle](https://github.com/vercel/next.js/discussions/68160)
- [Next.js — output & file tracing config](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- Prior build-blocker spec, same protocol: [pdf-parse-new-build-fix](../pdf-parse-new-build-fix/spec.md)
- [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
