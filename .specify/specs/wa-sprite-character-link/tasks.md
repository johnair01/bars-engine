# Tasks: WorkAdventure Sprite Bridge & Character Link (WSC)

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md) · **Comparison:** [compare-workadventure-sprites.md](./compare-workadventure-sprites.md)

**Rule:** complete phases in order. Phase 0 is this run; Phase 1 hardens what PR #991 already ships; Phase 2 is the creator link; Phase 3 replaces provisional art. Do not start Phase 2 UI until the Phase 1 invariant test is in place.

---

## Phase 0 — Comparison and seed (this run)

- [ ] **T001** Review [compare-workadventure-sprites.md](./compare-workadventure-sprites.md); correct any claim that does not match WA 1.35 or the current bars-engine code.
- [ ] **T002** Confirm the bridge decision: WA `woka` full-body sheet, no layer part mapping in v1.
- [ ] **T003** Confirm the open questions and recommendations in §6 of the comparison.
- [ ] **T004** Add the backlog row `1.86 WSC` and prompt `.specify/backlog/prompts/wa-sprite-character-link.md`.
- [ ] **T005** Run `npm run backlog:seed` after the backlog row is in place; if the ledger tail is corrupt, fix or isolate it first and report.

**Exit:** spec + comparison reviewed; no code change required for Phase 0.

---

## Phase 1 — Bridge hardening

### Invariants

- [ ] **T101** Add a regression test: `room/access` never returns `isCharacterTexturesValid: true` with `characterTextures: []` for a known or unknown player.
- [ ] **T102** Add a test: anonymous request with `characterTextureIds=wa:argyra:bold-heart` returns that texture and `valid: true`.
- [ ] **T103** Add a test: anonymous request with an unknown id returns `valid: false` and `[]` (picker).
- [ ] **T104** Add a test: `save-textures` rejects an unknown id with `400` and does not modify the player.
- [ ] **T105** Add a test: `save-textures` preserves `domainKey` and `genderKey` when rewriting `avatarConfig`.
- [ ] **T106** Add a test: `woka/list` returns the `woka` part, 40 textures, `id` shape `wa:<nation>:<archetype>`, absolute `url`.

**Files:** `src/lib/wa/__tests__/woka.test.ts`, `src/app/api/room/access/route.ts`, `src/app/api/save-textures/route.ts`, `src/app/api/woka/list/route.ts`.

### Compiler gate

- [ ] **T107** Add a dimension check: every generated sheet is exactly 96×128 RGBA.
- [ ] **T108** Add a lower-body coverage check per frame (e.g. non-transparent pixels in the bottom 24 px of each 32×32 cell); fail with `<nation>/<archetype>` and frame index.
- [ ] **T109** Emit `catalogVersion` (content hash) in `catalog.json`; return it as an `ETag` or `x-woka-catalog-version` header on `woka/list`.
- [ ] **T110** Re-run `npm run wa:woka`; verify 40 sheets and a stable hash on a second run.

**Files:** `scripts/wa/build-woka-catalog.mjs`, `public/wa/woka/catalog.json`, `src/app/api/woka/list/route.ts`.

### OIDC callback

- [ ] **T111** Reproduce the `/openid-callback` "session has expired" failure with a scripted login that completes inside the 2-minute code TTL (not a manual preview reload). Capture the state/PKCE cookie, code, and timing.
- [ ] **T112** If the scripted flow keeps state and completes, record the prior failure as a manual-test artifact and close this task without changing server code.
- [ ] **T113** If the scripted flow loses the cookie, fix the cookie `SameSite`/`Path`/domain on the WA side (config only) or document the required box `.env` change.
- [ ] **T114** Replace the dead-end callback error with a "Start signing in again" action that preserves `returnTo`.
- [ ] **T115** Verify the signed-in admin renders the saved sheet, not the ghost (WA may still preload `character_color21.png`/`character_eyes23.png`; check the visible avatar, not just the request log).

**Files:** box `.env`/config, `world` login flow, possibly `src/app/api/oidc/*`; no fork.

### Live checks

- [ ] **T116** `curl -s https://bars-engine.vercel.app/api/woka/list | jq '.woka.collections[0].textures | length'` → `40`.
- [ ] **T117** Fetch the first sheet with `curl -I`; confirm `200`, `image/png`, `access-control-allow-origin: https://world.masteringallyship.com`, and `access-control-allow-credentials: true`. **Do not accept `*`** — WA's credentialed image load rejects it.
- [ ] **T118** Enter the dojo with a player whose `avatarConfig` is set; confirm the chosen sheet is visible at the player's position and the socket stays open.

---

## Phase 2 — Creator link

### Server action

- [x] **T201** Add `src/actions/character-sprite.ts` with `saveCharacterSprite({ textureId })`.
- [x] **T202** Auth via `getCurrentPlayer()`; return `{ success: false, error: 'unauthorized' }` when absent.
- [x] **T203** Resolve the texture through the catalog; reject unknown ids with `unknown_texture`.
- [x] **T204** Preserve existing `domainKey`/`genderKey`; write `avatarConfig.waWokaId`; revalidate `/character/create`, `/character/[shareToken]`, `/`.
- [ ] **T205** Unit-test the mapper and the action's rejection paths.

### UI step

- [x] **T206** Add a **Body** step to `OuroborosInterviewClient` after nation + archetype are known.
- [x] **T207** List the six layer parts with thumbnails + a live 96×128 composed preview (`image-rendering: pixelated`).
- [x] **T208** Preseed clothes/hat/accessory from `nationKey`/`archetypeKey` when known; otherwise use catalog defaults.
- [ ] **T209** Keyboard navigation, visible focus, `aria-pressed`/radio semantics, text label per body.
- [x] **T210** "Save character" calls `saveCharacterSprite`; show inline success/error; do not advance the narrative step on failure.
- [ ] **T211** If the player later changes nation/archetype and `waWokaId` no longer matches, show a reconcile prompt ("Keep current body" / "Update to match") instead of silently overwriting.
- [ ] **T212** Render the chosen body on `/character/[shareToken]` via the catalog preview.
- [ ] **T213** Add a link from `/character-creator` ("Choose the body you walk around in") to `/character/create`.

**Files:** `src/app/character/create/OuroborosInterviewClient.tsx`, `src/actions/character-sprite.ts`, `src/app/character/[shareToken]/page.tsx`, `src/app/character-creator/CharacterCreatorRunner.tsx`, `src/components/character-creator/CharacterCreatorAvatarPreview.tsx`.

### Fallback behavior

- [ ] **T214** Confirm a player with no `avatarConfig` entering the world still gets WA's picker, and that pick writes `avatarConfig` through `save-textures`.
- [ ] **T215** Confirm the creator's choice wins on the next join (no double picker).
- [x] **T216** Decide what to do with WA's stock **Build your WOKA** button: supply layer collections, hide/redirect it via a supported WA config, or document it as a known dead end until the bars-engine Body step replaces it.

---

## Phase 3 — Compile from bars-engine sources

> **Bridge delivered:** `scripts/wa/build-woka-layers.mjs` partitions the canonical dojo walker into six pixel-complete parts (body 4, eyes 5, hair 5, clothes 40, hat 6, accessory 9) and `npm run wa:assets` regenerates them. The compositor is `composeWokaLayers()` and the live preview is `/api/woka/compose`. The tasks below replace this bridge with full-body 12-frame compiled walkers.

- [ ] **T301** Choose the full-body 12-frame walk source per nation × archetype (walkable sources or a new walker), and document it.
- [ ] **T302** Extend `build-woka-catalog.mjs` to compose 3×4 at 32×32 from those frames.
- [ ] **T303** Apply the nation palette with the same rules as the provisional sheets; keep skin/hair/shading.
- [ ] **T304** Add `source: 'compiled' | 'provisional'` to each catalog entry; keep provisional as fallback.
- [ ] **T305** Run the lower-body gate on compiled sheets; fail the build on a bust.
- [ ] **T306** Update `docs/WA_IDENTITY_AND_ASSETS.md` with sources, attribution, and licensing.
- [ ] **T307** Visually compare a compiled sheet in the dojo against the portrait and walkable; confirm the same character reads across all three.

---

## Phase 4 — Verification quest

- [ ] **T401** Add `cert-wa-sprite-link-v1` to the certification seed (deterministic Twine + system BAR).
- [ ] **T402** Steps 1–6 in [spec.md](./spec.md#verification-quest) pass.
- [ ] **T403** Add a smoke script (`scripts/wa/smoke-sprite-link.mjs`) for catalog shape, sheet fetch, save round-trip, and access resolution.
- [ ] **T404** Run the smoke script against production after deploy.
- [ ] **T405** Update `BACKLOG.md` status and run `npm run backlog:seed`.

---

## Dependency graph

```
T001–T005 (Phase 0)
      │
      ▼
T101–T106 (invariants) ──► T107–T110 (compiler)
      │                         │
      ▼                         ▼
T111–T118 (OIDC + live) ──► T201–T205 (action)
                                │
                                ▼
                          T206–T215 (UI)
                                │
                                ▼
                          T301–T307 (compiled art)
                                │
                                ▼
                          T401–T405 (cert)
```

---

## Definition of done

- A signed-in player can choose a body in bars-engine and enter the dojo as that body.
- No path returns `valid: true` with zero textures.
- An anonymous visitor can pick and keep a body locally without a player row.
- The catalog is deterministic, validated, and replaceable without API changes.
- `cert-wa-sprite-link-v1` passes on production.
- No WorkAdventure fork, no Prisma migration, no client-side admin token.
