# Plan: WorkAdventure Sprite Bridge & Character Link (WSC)

**Spec:** [spec.md](./spec.md) · **Comparison:** [compare-workadventure-sprites.md](./compare-workadventure-sprites.md)

---

## 1. Technical context

| Layer | Current implementation |
|---|---|
| Identity | OIDC provider in `src/lib/wa/{config,jwt,oidc,admin-auth}.ts`; `sub = Player.id`; RS256 + JWKS. |
| WA Admin API | `src/app/api/{capabilities,room/access,woka/list,save-textures,map}/route.ts`; shared bearer token; player re-read every call. |
| Catalog | `scripts/wa/build-woka-catalog.mjs` → `public/wa/woka/catalog.json` + `public/wa/woka/sheets/<nation>/<archetype>.png`. |
| Publish | `scripts/wa/publish-world.mjs` → validates with WA `MapValidator`, uploads to map-storage. |
| Portrait | `src/lib/avatar-parts.ts` → `Avatar.tsx` / `CharacterCreatorAvatarPreview.tsx`; 5 layers, 64×64. |
| Walkable | `src/lib/avatar-utils.ts` → `public/sprites/walkable/<nation>-<archetype>.png`; 512×64, 8 frames, Pixi. |
| Creator | `/character/create` (`OuroborosInterviewClient`) writes `avatarConfig` on completion via `advanceOuroborosInterview`; `/character-creator` edits playbook. |
| WA world | Stock v1.35 on the box; `START_ROOM_URL` points at the dojo `.wam`; map-storage hosts assets. |

**Key gap:** the creator writes `avatarConfig`, and the bridge *can* resolve it to `wa:<nation>:<archetype>`, but the player never sees the body they will inhabit. There is no sprite step and no `waWokaId` override. A manual OIDC callback test once hit the 2-minute code TTL after a preview reload; re-test with a scripted flow before treating it as a product bug.

**Constraints:**
- Stock WorkAdventure 1.35; config-only on the box.
- No Prisma migration for `waWokaId`; keep it inside `avatarConfig` JSON.
- No AI at request time; deterministic compile.
- 64×64 portrait and 512×64 walkable stay as-is.
- Do not touch co-tenant stacks or the `edge` network.

---

## 2. Constitution / practice check

| Gate | Status |
|---|---|
| Spec before code | ✅ this kit |
| API-first contract | ✅ four contracts in [spec.md](./spec.md#api-contracts-api-first) |
| Deterministic over AI | ✅ compiler is local, no model calls |
| One identity | ✅ `sub = Player.id`, no second character table |
| No schema change without migration discipline | ✅ `waWokaId` inside existing JSON |
| Verification quest | ✅ `cert-wa-sprite-link-v1` defined |
| Secrets server-side | ✅ token never reaches the browser |
| Backward compatible | ✅ `waWokaId` optional; default resolves by nation × archetype |

---

## 3. Architecture

```
                      ┌──────────────────────────────┐
                      │ Player.avatarConfig          │
                      │ nationKey, archetypeKey,     │
                      │ waWokaId?, variant, gender   │
                      └──────────────┬───────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
  Portrait 64×64              Walkable 512×64              Woka 96×128
  avatar-parts.ts             walkable/*.png               wa/woka/sheets/*
  Avatar.tsx                  Pixi RoomRenderer             WA Phaser
        │                            │                            │
        └─────────────── character creator ──────────────────────┘
                       /character/create
                       (nation × archetype)
```

**Write paths (both land in `Player.avatarConfig`):**
1. **bars-engine creator** → `saveCharacterSprite` Server Action (session auth) — preferred.
2. **WA picker** → WA server → `POST /api/save-textures` (shared token) — fallback.

**Read path:**
1. WA server → `GET /api/room/access?userIdentifier=<sub>` → re-read player → resolve `waWokaId` or default → `characterTextures` + `isCharacterTexturesValid`.
2. WA client loads the 96×128 sheet, slices 32×32 frames, plays the 12-frame walk.

---

## 4. Phases

### Phase 0 — Comparison (this run)

Deliver:
- `compare-workadventure-sprites.md` with the WA contract, bars-engine contract, mapping table, and open questions.
- `spec.md`, `plan.md`, `tasks.md`.
- Backlog row + prompt.

Exit: comparison reviewed; decision recorded: **WA `woka` full-body texture is the bridge; no layer mapping in v1.**

### Phase 1 — Bridge hardening (PR #991 follow-through)

1. Add regression tests for:
   - `room/access` never returns `valid: true` with `[]`;
   - anonymous `characterTextureIds` echo;
   - `save-textures` unknown id → 400;
   - `woka/list` returns `woka`, not `body`.
2. Make the compiler fail on non-96×128 or bust-only frames (lower-body opacity check).
3. Add a catalog version/hash to `woka/list` response headers for cache busting.
4. Diagnose the OIDC callback session-expiry path:
   - use a scripted login that completes inside the 2-minute code TTL (the prior failure followed a manual preview reload);
   - confirm the state/PKCE cookie survives the bars-engine login redirect;
   - only change server code if the scripted flow also loses state or rejects a fresh code;
   - add a single retry instruction on `/openid-callback` failure instead of a dead end.
5. Verify signed-in player renders the chosen sheet, not the ghost.

**Files:** `src/app/api/{room/access,save-textures,woka/list}/route.ts`, `src/lib/wa/woka.ts`, `scripts/wa/build-woka-catalog.mjs`, tests under `src/lib/wa/__tests__/`.

### Phase 2 — Creator link

1. Add a **Body** step to `OuroborosInterviewClient` after nation + archetype:
   - grid/list of 40 catalog bodies, keyboard accessible;
   - 96×128 preview (scaled up with `image-rendering: pixelated`);
   - default selection `wa:<nationKey>:<archetypeKey>`;
   - "Use this body" writes via `saveCharacterSprite`.
2. Add `saveCharacterSprite` Server Action in `src/actions/`:
   - `getCurrentPlayer()`; reject unknown texture; write `avatarConfig.waWokaId`;
   - revalidate `/character/create`, `/character/[shareToken]`, `/`.
3. Preserve the player's explicit choice:
   - if `waWokaId` exists and nation/archetype later change, show "Body no longer matches your nation/archetype — keep or update?" rather than silently overwriting.
4. Render the chosen body on the shareable card at `/character/[shareToken]`.
5. Keep `/character-creator` as the playbook editor; link to `/character/create` for the visual step.

**Files:** `src/app/character/create/OuroborosInterviewClient.tsx`, `src/actions/ouroboros-interview.ts`, new `src/actions/character-sprite.ts`, `src/app/character/[shareToken]/page.tsx`, `src/lib/wa/woka.ts`.

### Phase 3 — Compile from bars-engine sources

1. Define full-body 12-frame walk sources per nation × archetype. Portrait layers cannot produce legs; use the walkable sources or a new full-body walker.
2. Extend `build-woka-catalog.mjs`:
   - read source frames;
   - apply nation palette (same HSL band rules as provisional sheets);
   - compose 3×4 at 32×32 into 96×128;
   - emit catalog entries with `source: 'compiled' | 'provisional'`.
3. Gate on lower-body pixel coverage; keep provisional sheets as fallback.
4. Document licensing/attribution for the source walkers.

**Files:** `scripts/wa/build-woka-catalog.mjs`, `public/wa/woka/`, `docs/WA_IDENTITY_AND_ASSETS.md`.

### Phase 4 — Verification

1. Seed `cert-wa-sprite-link-v1` (deterministic Twine + system BAR).
2. Run the six-step quest in [spec.md](./spec.md#verification-quest).
3. Add a smoke script for CI: catalog shape, one sheet fetch, `save-textures` round-trip against a test player, `room/access` resolution.
4. Update `BACKLOG.md` and `npm run backlog:seed`.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Two pickers write different fields | Both paths call the same `textureId → avatarConfig` mapper in `src/lib/wa/woka.ts`. |
| Ghost returns if `valid: true` with `[]` | Explicit invariant + regression test + runtime assertion. |
| Catalog drift between sheets and JSON | Generate JSON from the same pass that writes sheets; hash the catalog. |
| OIDC code expires during manual testing | Use an automated callback test; show a "start again" action on failure. |
| Art reads as a bust | Lower-body opacity gate; keep full-body provisional sheets until compiled art passes. |
| Sheet URL blocked by CORS | Reflect the world origin + `Access-Control-Allow-Credentials: true`; never `ACAO: *` with credentials. Test all three image modes. |
| Player changes nation/archetype after choosing a body | Preserve explicit `waWokaId`; offer a reconcile prompt, do not silently overwrite. |
| Backlog ledger corruption | Add the row above the duplicated tail; run seed only after a dry check. |

---

## 6. Verification plan

```bash
# unit + contract
npx vitest run src/lib/wa
npx tsc --noEmit

# compiler
npm run wa:woka
node -e "const c=require('./public/wa/woka/catalog.json'); console.log(c.collections[0].textures.length)"

# live Admin API
curl -s https://bars-engine.vercel.app/api/woka/list | jq '.woka.collections[0].textures[0]'

# world
curl -sI https://world.masteringallyship.com/_/global/world.masteringallyship.com/~/calrunian-dojo/calrunian-dojo.wam
```

Manual:
1. Log in with an account that has `avatarConfig`.
2. Enter the dojo; inspect the Phaser texture key / network request for the sheet.
3. Confirm the visible avatar is the chosen sheet, not the grey ghost. WA may still preload `character_color21.png`/`character_eyes23.png`; a request alone is not a failure.
4. Pick a different body in the creator; reload; confirm the new sheet.

---

## 7. Rollout

1. Merge PR #991 (bridge) after tests.
2. Ship Phase 1 hardening as a small follow-up PR.
3. Ship Phase 2 creator link behind the existing `/character/create` auth gate.
4. Replace provisional art in Phase 3 with no API change.
5. Rollback: revert the UI step; the WA picker still writes `avatarConfig`, so the world keeps working.
