# Compare & Contrast: WorkAdventure Sprites vs bars-engine Avatars

**Status:** Phase 0 research for [WSC](./spec.md). This document is the comparison the spec depends on.

**Scope:** How WorkAdventure (WA) represents, selects, stores, and renders a player character; how bars-engine does the same; what to adopt, adapt, or leave behind so one character choice works on `world.masteringallyship.com` and in bars-engine.

---

## 1. The two models at a glance

| Dimension | WorkAdventure 1.35 | bars-engine |
|---|---|---|
| Unit of character | A **woka texture**: a 96×128 PNG, 3 columns × 4 rows of 32×32 cells | An **`avatarConfig`** JSON: `nationKey`, `archetypeKey`, `variant`, `genderKey`, optional `domainKey` |
| Representation | One full-body character per texture (the `woka` part), **or** six stacked layer parts (`body`, `eyes`, `hair`, `clothes`, `hat`, `accessory`) | Portrait: 5 stacked 64×64 RGBA layers. Walkable: one precomposed 512×64 sheet, 8 frames of 64×64. |
| Directions / animation | 4 facings × 3 walk frames = 12 frames. Idle is frame 1/4/7/10. | Walkable: 8 frames (`N_idle`, `N_walk`, `S_idle`, `S_walk`, `E_idle`, `E_walk`, `W_idle`, `W_walk`). Portrait: static. |
| Selection UI | WA's `WokaSelectScene` (full `woka`) or `WokaCustomizeScene` (layered parts) | `/character-creator` v2 (narrative: discovery → archetype → moves), plus profile/onboarding derivation |
| Persistence | `POST /save-textures` to the Admin API; the Admin API decides where to store it | `Player.avatarConfig` (JSON), `Player.avatarSpritePath`, `Player.walkableSpritePath` |
| Identity | OIDC `sub` = WA `userIdentifier`; WA calls the Admin API with a shared bearer token | `Player.id` = OIDC `sub`; Admin API re-reads the player every join |
| Default / fallback | If no valid textures: picker. If the socket has no textures: WA loads `character_color21.png` + `character_eyes23.png` — the "ghost" | Missing portrait parts fall back to initials / base; missing walkable falls back to `default.png` |
| Serving | `woka/list` returns absolute or pusher-relative URLs; `WokaImage` draws with `crossOrigin="user-credentials"` | Static `/sprites/...`; generated woka sheets on bars-engine `/wa/woka/...` |
| Authoring | Admin uploads or a Woka provider (WA SaaS, LocalAdmin `woka.json`) | Manual/AI/LPC assets in `public/sprites`, plus scripts; no player-facing asset picker |
| Licensing | Pipoya CC0 walkers in WA; LocalAdmin `woka.json` includes Pipoya and custom sheets | Mixed: CC0, LPC CC-BY-SA where used; attribution tracked in docs |

---

## 2. WorkAdventure's sprite contract (what actually happens)

### 2.1 The data shape

`WokaList` is a record of **parts**. Each part has `collections`, each collection has `textures`:

```ts
type WokaList = Record<
  'woka' | 'body' | 'eyes' | 'hair' | 'clothes' | 'hat' | 'accessory',
  {
    required?: boolean
    collections: Array<{
      name: string
      textures: Array<{ id: string; name: string; url: string; tintable?: boolean }>
    }>
  }
>
```

`WokaDetail` is only `{ id, url }` — that is what `room/access` returns as `characterTextures`.

### 2.2 Two different pickers

1. **`WokaSelectScene`** reads `wokaData.woka.collections`, shows a grid of full characters, and saves **one** texture id. This is the path that fits bars-engine's nation × archetype model.
2. **`WokaCustomizeScene`** reads `wokaData.body/eyes/hair/clothes/hat/accessory`, shows layer categories, and saves an **array** of layer ids (up to six). `WokaImage` stacks them and also draws a `woka` part if one is present.

The scene is chosen in `WokaScene.svelte`: if the saved texture array has more than one id, it opens the layer customizer; otherwise it opens the full-woka picker.

### 2.3 The 12-frame sheet

Every texture is loaded as a Phaser spritesheet with `frameWidth: 32`, `frameHeight: 32`:

```
row 0 (down):  0  1  2      walk frames 0,1,2; idle 1
row 1 (left):  3  4  5      walk frames 3,4,5; idle 4
row 2 (right): 6  7  8      walk frames 6,7,8; idle 7
row 3 (up):    9 10 11      walk frames 9,10,11; idle 10
```

Animation uses `[0,1,2,1]`, `[3,4,5,4]`, `[6,7,8,7]`, `[9,10,11,10]` at 10 fps. That is why a bust-only or 8-frame sheet does not satisfy WA, and why a 96×128 sheet with twelve proper frames is the bridge format.

**CORS detail (the ghost's real cause):** `WokaImage` loads each texture with `crossOrigin="use-credentials"`. A credentialed image load rejects `Access-Control-Allow-Origin: *`; the PNG can return 200 and still fail in the image element. The API must reflect the world origin (`https://world.masteringallyship.com`) and send `Access-Control-Allow-Credentials: true`. Without it, WA logs "One of your Woka textures is invalid for this world" and redirects to the picker.

### 2.4 The join / save loop

```
WA client                         WA play server                  Admin API
  |  GET /me ---------------------->|                               |
  |                                 |  GET /api/room/access ------->|
  |                                 |<-- characterTextures, valid? -|
  |<-- authToken, userUuid ---------|                               |
  |                                 |                               |
  |  (picker) POST /save-textures ->|  POST /api/save-textures ---->|
  |                                 |                               | writes player record
  |  reconnect with characterTextureIds --------------------------->|
  |                                 |  GET /api/room/access ------->|
  |                                 |<-- chosen textures -----------|
```

Two details matter for bars-engine:

- **The browser never holds the Admin API token.** WA's server calls bars-engine with the shared token; `userIdentifier` comes from the authenticated WA token, not from the browser body.
- **`isCharacterTexturesValid` is a gate.** If the Admin API returns `false`, WA rejects the socket with `invalidTexture` and shows the picker. If it returns `true` with an empty array, WA opens the room with no textures and draws the fallback ghost. The two fields must agree.
- **WA sends `characterTextureIds[]`, not `characterTextureIds`.** Axios serialises array params with brackets. The Admin API must read both shapes (and comma-separated values), or it sees an empty list and rejects a valid anonymous pick.

### 2.5 The ghost

The "ghost" is not a design. It is WA's fallback when `characterTextureIds` is empty or every texture fails to load:

```ts
{ id: 'color_22', url: 'resources/customisation/character_color/character_color21.png' },
{ id: 'eyes_23', url: 'resources/customisation/character_eyes/character_eyes23.png' },
```

Any fix that only returns "valid: true" without a texture leaves the player as this ghost.

---

## 3. bars-engine's avatar contract

### 3.1 One config, three renderers

`AvatarConfig` is the source of truth:

```ts
{ nationKey, archetypeKey, domainKey?, variant, genderKey? }
```

It feeds:

1. **Portrait** — `getAvatarPartSpecs()` → ordered 64×64 layers (`base` → `nation_body` → `archetype_outfit` → `nation_accent` → `archetype_accent`), stacked by `Avatar.tsx`.
2. **Walkable** — `getWalkableSpriteUrl()` → `public/sprites/walkable/{nationKey}-{archetypeKey}.png`, 512×64, 8 frames, Pixi renderer.
3. **Provenance** — planned stamp, not relevant to this bridge.

### 3.2 The character creator today

`character-creator-v2` is a narrative wizard. It chooses archetype, moves, and nation, and writes `PlayerPlaybook` plus `player.archetypeId`. It does **not** choose a visual sprite, and it does not write a WA woka texture. `deriveAvatarFromExisting` can derive `avatarConfig` from nation/archetype, but there is no player-facing "pick the body you will walk around in" step.

### 3.3 The WA bridge already in PR #991

The branch `feat/wa-identity-character` adds:

- `GET /api/woka/list` — returns a single `woka` collection with 40 textures, id `wa:<nation>:<archetype>`.
- `POST /api/save-textures` — maps a woka texture id back to `avatarConfig`; writes `Player.avatarConfig`.
- `GET /api/room/access` — resolves `avatarConfig` → `wokaDetail`, returns `isCharacterTexturesValid`.
- `scripts/wa/build-woka-catalog.mjs` + `npm run wa:woka` — generates 96×128 sheets and `catalog.json`.
- `scripts/wa/publish-world.mjs` + `npm run wa:publish` — checks and uploads a world.

That is the bridge. The missing link is the **creator surface** that lets a player make the choice on bars-engine, and a **compiler** that makes the bridge art from the same source as the portrait/walkable renderers.

---

## 4. What maps cleanly, what does not

| WA concept | bars-engine equivalent | Verdict |
|---|---|---|
| `woka` full-body texture | `nationKey × archetypeKey` character | **Adopt as the bridge.** One woka id per character pair. |
| 96×128, 3×4, 32px frames | Walkable is 512×64, 8×64px; portrait is 64×64 | **Compile.** Do not try to render the same file in both engines at runtime. |
| `body/eyes/hair/clothes/hat/accessory` layers | Portrait's five layers | **Do not map 1:1.** Different canvas, different art, different ordering. Keep WA's layer picker out of bars-engine v1. |
| `save-textures` array | `avatarConfig` JSON | **Adapt.** Take the first valid id; ignore extra layer ids for now. |
| `isCharacterTexturesValid` | `Boolean(resolveWokaForPlayer(...))` | **Adopt.** It is the correct gate. |
| `characterTextureIds` sent on reconnect | local anonymous pick / saved player choice | **Adopt.** Echo catalog-valid ids for anonymous players. |
| WA `woka/list` admin endpoint | static catalog + Admin API | **Adopt.** Single catalog, served by bars-engine. |
| WA's Woka picker UI | bars-engine character creator | **Link, don't fork.** Use our creator as the primary surface; WA's picker is the fallback. |

---

## 5. Recommended architecture: one choice, three renders

```
Player.avatarConfig  (nationKey, archetypeKey, waWokaId?, genderKey)
        |
        +--> Portrait (64x64 layers)        existing Avatar.tsx
        +--> Walkable (512x64, 8 frames)   existing Pixi renderer
        +--> Woka sheet (96x128, 12 frames) WA world
                 ^
                 |
        scripts/wa/build-woka-catalog.mjs
        (deterministic palette + frame compiler)
```

- **`waWokaId` is optional.** The default is `wa:${nationKey}:${archetypeKey}`. A player who picks a non-default body can store `waWokaId` in the same JSON without a schema migration.
- **The compiler is deterministic.** Input: checked-in walker frames + nation palette. Output: 96×128 sheet + catalog entry. No AI at request time.
- **The creator writes once.** `saveCharacterSprite` (session-authenticated) writes `avatarConfig`; WA's `save-textures` writes the same field when the player uses WA's fallback picker.
- **The world never trusts the browser.** `room/access` re-reads the player by `sub`; the shared admin token stays server-side.

---

## 6. Open questions

1. **Creator placement.** Should the sprite step be a new phase in `character-creator-v2`, or a standalone `/character/sprite` reached after the narrative wizard? Recommendation: a phase after archetype + nation are known, before the shareable card.
2. **Art source.** Keep the 40 palette variants as provisional, or compile from the portrait/walkable sources now? Recommendation: keep the 40 for the bridge, add a **full-body validation gate**, and replace with composed ARDS walkers when those exist.
3. **Layer customization.** Do we ever expose WA's six layer parts? Recommendation: no for v1; one full-body choice is enough for the dojo and avoids a second character ontology.
4. **Anonymous players.** Should they pick a sprite before login, or be forced to log in? Recommendation: allow the picker, persist locally, and merge on login (the current WA behavior); do not block the world.

---

## 7. References

- [WSC spec](./spec.md) · [plan](./plan.md) · [tasks](./tasks.md)
- [WA identity and assets](../../../docs/WA_IDENTITY_AND_ASSETS.md)
- [SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md) · [WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md)
- [avatar-utils.ts](../../../src/lib/avatar-utils.ts) · [avatar-parts.ts](../../../src/lib/avatar-parts.ts)
- [character-creator-v2](../character-creator-v2/spec.md) · [sprite-generation-pipeline](../sprite-generation-pipeline/spec.md)
- WorkAdventure source (deployed box): `play/src/front/Phaser/Entity/PlayerTextures.ts`, `play/src/front/Components/Woka/WokaSelectScene.svelte`, `play/src/front/Components/Woka/WokaCustomizeScene.svelte`, `play/src/pusher/services/AdminApi.ts`
