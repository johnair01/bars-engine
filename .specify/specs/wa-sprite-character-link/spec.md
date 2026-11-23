# Spec: WorkAdventure Sprite Bridge & Character Link (WSC)

## Purpose

Make **one character choice** produce a playable body everywhere: bars-engine's portrait, bars-engine's walkable sprite, and the WorkAdventure woka on `world.masteringallyship.com`.

**Problem:** the two systems already carry the same identity (`Player.id` via OIDC) but keep separate sprite vocabularies. bars-engine has a layered 64×64 portrait and an 8-frame 512×64 walkable sheet. WorkAdventure needs a 96×128, twelve-frame 32×32 woka sheet. Today a player can finish the narrative character creator and still enter the dojo as WorkAdventure's fallback "ghost", because no creator surface writes a woka texture and no compiler derives one from `avatarConfig`.

**This run (Phase 0):** compare and contrast the two sprite models and pull the WorkAdventure contract into bars-engine so the character creator can link to it. The comparison is [compare-workadventure-sprites.md](./compare-workadventure-sprites.md).

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

---

## Design Decisions

| Topic | Decision |
|---|---|
| One identity | `sub = Player.id` stays the only identity. `Player.avatarConfig` stays the only sprite choice. No second character table. |
| One character, three renders | Portrait (64×64 layers), walkable (512×64, 8 frames), and woka (96×128, 12 frames) are **renders of the same config**, not competing characters. |
| WA `woka` part, not layers | The bridge uses WorkAdventure's **full-character** `woka` collection. We do **not** map bars-engine's portrait layers onto WA's `body/eyes/hair/clothes/hat/accessory` parts in v1. |
| Deterministic compiler | `npm run wa:woka` compiles checked-in walker frames + nation palette into 96×128 sheets and `catalog.json`. No AI at request time. |
| `waWokaId` escape hatch | Texture id is `wa:<nation>:<archetype>` by default. A non-default body stores `waWokaId` inside the existing `avatarConfig` JSON. **No Prisma migration.** |
| Creator is bars-engine | The primary selection surface is bars-engine (the character creator), authenticated by the player's session. WA's own picker remains a fallback for players who enter the world first. |
| Server-to-server Admin API | WorkAdventure calls bars-engine with `WA_ADMIN_API_TOKEN`; the player's browser never holds it. `room/access` re-reads the player by `sub` every call. |
| Anonymous is first-class | An anonymous visitor may pick locally; the Admin API echoes catalog-valid `characterTextureIds` so the socket does not fall back to the ghost. First-time anonymous visitors get the picker, not an empty-valid room. |
| Stock WA | No WorkAdventure fork or custom image. Box changes remain config only. |

---

## Conceptual Model

| Dimension | Mapping |
|---|---|
| **WHO** | Nation × archetype (the existing `avatarConfig`). This is the character's identity. |
| **WHAT** | The visual body the player walks around in; the sprite is the identity made visible, not a separate progression system. |
| **WHERE** | bars-engine `/character-creator` (choice) and `world.masteringallyship.com` (embodiment). |
| **Energy** | None in v1. Choosing a body does not mint or spend vibeulons. |
| **Personal throughput** | Wake Up — see the body you will inhabit before entering the shared world. |

---

## Current State (what already exists)

| Piece | Status |
|---|---|
| OIDC provider + JWKS in bars-engine | Shipped in PR #991; live on `bars-engine.vercel.app`. |
| `GET /api/woka/list` (WA Admin API) | Shipped; returns one `woka` collection, 40 textures. |
| `POST /api/save-textures` | Shipped; maps texture id → `avatarConfig`. |
| `GET /api/room/access` | Shipped; resolves `avatarConfig` → `characterTextures`, returns `isCharacterTexturesValid`. |
| `npm run wa:woka` | Shipped; compiles 40 provisional 96×128 sheets + `catalog.json`. |
| Anonymous texture echo | Shipped in follow-up commit; echoes valid `characterTextureIds`, sends first-timers to the picker. |
| bars-engine character creator writes a woka | **Missing.** `character-creator-v2` writes playbook/moves, not a sprite. |
| Compiler from bars-engine parts | **Missing.** Sheets are palette variants of dojo walkers, not compiled from portrait/walkable sources. |
| Verification quest | **Missing.** |

---

## API Contracts (API-First)

### 1. `GET /api/woka/list` — WA Admin API

**Auth:** `Authorization: <WA_ADMIN_API_TOKEN>`
**Input:** `roomUrl` query (ignored in v1; the catalog is global)
**Output:** WorkAdventure `WokaList`

```ts
type WokaList = {
  woka: {
    required: true
    collections: Array<{
      name: string
      textures: Array<{ id: string; name: string; url: string }>
    }>
  }
}
```

Rules:
- Exactly one part, named `woka`.
- Every texture id is `wa:<nationKey>:<archetypeKey>`.
- Every `url` is absolute and points at the bars-engine deployment.
- Do **not** return `body`/`eyes`/`hair`/`clothes`/`hat`/`accessory` unless the sheet actually contains those layers.

### 2. `POST /api/save-textures` — WA Admin API

**Auth:** same shared token
**Input:**

```ts
{ playUri?: string; userIdentifier: string; textures: string[] }
```

**Output:** `204 No Content`, or `400` for an unknown texture / missing fields, `404` for an unknown player.

Rules:
- Use `textures[0]` only in v1; reject arrays that contain no catalog id.
- Resolve the texture to `nationKey` + `archetypeKey`; preserve an existing `domainKey` and `genderKey`.
- Write `Player.avatarConfig`; never trust a client-supplied nation/archetype.
- Idempotent.

### 3. `GET /api/room/access` — WA Admin API

**Auth:** same shared token
**Input:** `userIdentifier` (the OIDC `sub`), `playUri`, optional repeated `characterTextureIds`.

**Output (player found):**

```ts
{
  status: 'ok'
  username: string
  userUuid: string
  tags: string[]
  isCharacterTexturesValid: boolean
  characterTextures: Array<{ id: string; url: string }>
  canEdit: boolean
  ...
}
```

Rules:
- If `avatarConfig` resolves, return exactly one `characterTextures` entry and `isCharacterTexturesValid: true`.
- If the player exists but has no character, return `isCharacterTexturesValid: false` and `characterTextures: []` so WA opens the picker.
- If the player is not found (anonymous), validate `characterTextureIds` against the catalog:
  - valid ids → echo them, `isCharacterTexturesValid: true`;
  - none → `isCharacterTexturesValid: false` (picker), **never** `true` with `[]`.

### 4. `saveCharacterSprite` — bars-engine Server Action (new)

**Auth:** player session (`getCurrentPlayer()`)
**Input:**

```ts
type SaveCharacterSpriteInput = { textureId: string }
```

**Output:**

```ts
type SaveCharacterSpriteResult =
  | { success: true; avatarConfig: string; wokaId: string }
  | { success: false; error: 'unauthorized' | 'unknown_texture' | 'no_player' }
```

Rules:
- Reject if the texture id is not in the catalog.
- Write the same `avatarConfig` mapping as `save-textures`.
- This is the creator's write path; the WA endpoint remains the fallback write path.

### 5. `npm run wa:woka` — compiler

**Input:** checked-in walker sources + palette table.
**Output:** `public/wa/woka/sheets/<nation>/<archetype>.png`, `public/wa/woka/catalog.json`.

Rules:
- 96×128 RGBA, 32×32 cells, 3 columns × 4 rows.
- Every frame must contain a full-body silhouette (not a bust) — add a lower-body opaque-pixel gate.
- Deterministic: same inputs produce byte-identical output.
- Catalog entries carry `id`, `name`, `path`, `nationKey`, `archetypeKey`, `genderKey`, `provisional`.

---

## User Stories

### P1: A signed-in player chooses a body and walks into the dojo with it

**As a player with a bars-engine account**, I want to choose my character's body in the creator, so I appear as that character on `world.masteringallyship.com` instead of a ghost.

**Acceptance:**
- The creator shows the 40 catalog bodies with a preview.
- Choosing one writes `avatarConfig` (including `waWokaId` if non-default).
- Entering the dojo loads the chosen 96×128 sheet; no fallback ghost.
- The portrait and walkable renderers show the same nation × archetype.

### P2: An anonymous visitor can still pick a body

**As an anonymous visitor**, I want to pick a body before creating an account, so I am not a ghost while I explore.

**Acceptance:**
- First join with no `characterTextureIds` shows WA's picker (or the bars-engine picker when embedded).
- After a pick, the reconnect carries the id and `room/access` echoes it.
- No server-side player row is required.

### P3: The creator links the narrative choice to the visual choice

**As a player**, after I choose my archetype and nation in the narrative creator, I want the sprite step to default to that nation × archetype, so I do not choose twice.

**Acceptance:**
- The sprite step preselects `wa:<nation>:<archetype>` when both are known.
- Changing the sprite does not change the narrative playbook; changing the archetype/nation updates the default sprite unless the player has explicitly overridden it.
- The shareable character card shows the selected sprite.

### P4: Art can be replaced without touching the API

**As a maintainer**, I want to replace a sheet or add an archetype and re-run one command, so the creator and the world stay in sync.

**Acceptance:**
- Dropping a new 96×128 sheet into the catalog source and running `npm run wa:woka` updates the catalog.
- `npm run wa:publish` uploads the world assets without changing the API.
- Invalid dimensions or a bust-only frame fail the build.

---

## Functional Requirements

### Phase 0 — Comparison and contract (this run)

- **FR1**: Publish [compare-workadventure-sprites.md](./compare-workadventure-sprites.md) covering WA parts, frame layout, pickers, save loop, fallback, and bars-engine's portrait/walkable/creator model.
- **FR2**: Record the bridge decision: WA `woka` full-body texture is the in-world render of `avatarConfig`; WA layer parts are out of scope for v1.
- **FR3**: Record the open questions (creator placement, art source, layer customization, anonymous behavior) with recommendations.

### Phase 1 — Bridge hardening

- **FR4**: `room/access` MUST NOT return `isCharacterTexturesValid: true` with an empty `characterTextures` for any user.
- **FR5**: `room/access` MUST echo catalog-valid `characterTextureIds` for an unknown/anonymous user.
- **FR6**: `save-textures` MUST reject unknown ids, preserve `domainKey`, and write only `avatarConfig`.
- **FR7**: `woka/list` MUST return the `woka` part (not `body`) and absolute URLs.
- **FR8**: The compiler MUST verify 96×128 dimensions and a per-frame lower-body presence; fail with the offending nation/archetype.
- **FR9**: Tests cover: catalog shape, texture → config mapping, unknown id rejection, anonymous echo, and the empty-valid regression.

### Phase 2 — Character creator link

- **FR10**: Add a sprite step to the bars-engine character creator (or a `/character/sprite` surface reached from it) that lists the catalog and previews a 96×128 sheet.
- **FR11**: The step preselects `wa:<nation>:<archetype>` from the player's nation/archetype; a manual choice sets `waWokaId` and is not overwritten by later narrative edits.
- **FR12**: `saveCharacterSprite` writes `avatarConfig` using the session, not a client-supplied `userIdentifier`.
- **FR13**: The shareable character card renders the chosen sprite.
- **FR14**: If the player has no `avatarConfig` when entering the world, the WA picker remains available and writes the same field.

### Phase 3 — Compiler from bars-engine sources (replaces provisional art)

- **FR15**: Define the source frames for a full-body walker per nation × archetype (portrait layers are not enough; a 12-frame walk source is required).
- **FR16**: Compile 96×128 sheets from those sources with the same palette rules as the walkable sheet.
- **FR17**: Keep the 40 provisional sheets as fallback until the compiled sheets pass the full-body gate.
- **FR18**: Document attribution and licensing for every source.

### Phase 4 — Verification

- **FR19**: Implement `cert-wa-sprite-link-v1` with the steps below.
- **FR20**: Add the spec to `BACKLOG.md` and run `npm run backlog:seed` when the backlog is synced.

---

## Non-Functional Requirements

- **No secrets in the browser.** The Admin API token stays on the WA server and the bars-engine server. The creator uses the player's session cookie.
- **Deterministic art.** The compiler has no AI/network calls; same inputs → same bytes.
- **Backward compatible.** `waWokaId` is optional; existing `avatarConfig` without it resolves by nation × archetype.
- **Performance.** Catalog JSON is small; sheet PNGs are cacheable. `woka/list` may be cached for the life of a deployment.
- **Accessibility.** The picker has a text label per body, keyboard navigation, and a visible selected state.
- **Licensing.** CC0/LPC attribution is preserved; no unlicensed art enters the catalog.

---

## Persisted data & Prisma

**No schema change in v1.** The choice lives inside `Player.avatarConfig`:

```json
{
  "nationKey": "argyra",
  "archetypeKey": "bold-heart",
  "variant": "default",
  "genderKey": "default",
  "waWokaId": "wa:argyra:bold-heart"
}
```

| Check | Done |
|---|---|
| Confirm `Player.avatarConfig` is a `String?` JSON column | ✅ existing |
| No new `Player.waWokaId` field (avoid migration) | ✅ |
| If a future query needs indexing by woka id, add a migration then | — |

---

## Scaling Checklist

| Touchpoint | Mitigation |
|---|---|
| Filesystem | Serve catalog/sheets as static files from the Next.js deployment; no runtime writes. |
| Uploads | `wa:publish` is an operator command, not a request path. |
| Request body | `save-textures` accepts a small JSON array; cap at 8 ids. |
| Image loading | Absolute HTTPS URLs; `WokaImage` uses `crossOrigin="use-credentials"`, so reflect `https://world.masteringallyship.com` and send `Access-Control-Allow-Credentials: true`. Never `ACAO: *` for these sheets. |
| Env | `WA_ADMIN_API_TOKEN`, `WA_OIDC_*`, `WA_MAP_STORAGE_PUBLIC_URL`, `WA_DOJO_WAM_URL` documented in `docs/WA_IDENTITY_AND_ASSETS.md`. |

---

## Verification Quest

- **ID:** `cert-wa-sprite-link-v1`
- **Narrative:** "Prepare a body for the party: choose a Calrunian character, then walk into the dojo as that character. This verifies that a guest's account, sprite, and world access all agree before the Bruised Banana fundraiser."
- **Steps:**
  1. Sign in with a bars-engine account that has no `avatarConfig`.
  2. Enter `world.masteringallyship.com`; confirm the character picker appears, not a ghost.
  3. Pick a body; confirm the preview shows a full-body 96×128 character.
  4. Continue into the dojo; confirm the avatar is the chosen body, the name and tags are the account's, and the editor is available if the account is an admin.
  5. Reload the world; confirm the choice persists without re-picking.
  6. Sign out and visit anonymously; confirm the picker appears, a pick persists locally, and the avatar is not a ghost.
- **Implementation:** extend `scripts/seed-cyoa-certification-quests.ts` (or the current cert seed) with a deterministic Twine story + system BAR; add `npm run seed:cert:wa-sprite-link` if a separate script is cleaner.
- **Reference:** [cyoa-certification-quests](../cyoa-certification-quests/).

---

## Dependencies

- PR #991 (`feat/wa-identity-character`) — OIDC, Admin API, catalog, publish.
- [character-creator-v2](../character-creator-v2/spec.md) — narrative creator, `PlayerPlaybook`.
- [avatar-system-strategy](../avatar-system-strategy/spec.md) — portrait/walkable renderers.
- [sprite-generation-pipeline](../sprite-generation-pipeline/spec.md) — future agent-generated art (not required for v1).
- WorkAdventure 1.35 on the box; no fork.
- `docs/WA_IDENTITY_AND_ASSETS.md`, `docs/SPRITE_ASSETS.md`, `docs/WALKABLE_SPRITES.md`.

---

## Non-Goals (v1)

- Exposing WA's six layer parts (`body`, `eyes`, `hair`, `clothes`, `hat`, `accessory`) as a bars-engine customization system.
- Per-player AI sprite generation.
- A WA fork or a second world server.
- Changing the portrait/walkable canvas sizes.
- Getting rid of WA's picker; it remains the fallback for players who arrive before creating a character.

---

## References

- [Compare & contrast](./compare-workadventure-sprites.md)
- [Plan](./plan.md) · [Tasks](./tasks.md)
- [WA identity and assets](../../../docs/WA_IDENTITY_AND_ASSETS.md)
- [SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md) · [WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md)
- [avatar-utils.ts](../../../src/lib/avatar-utils.ts) · [avatar-parts.ts](../../../src/lib/avatar-parts.ts)
- `src/lib/wa/*`, `src/app/api/{woka/list,save-textures,room/access}/route.ts`
