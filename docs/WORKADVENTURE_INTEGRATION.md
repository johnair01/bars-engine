# bars-engine × WorkAdventure — World Architecture

**Status:** design, for Wendell's ruling on §9.
**Ground:** verified against the live box (WorkAdventure `v1.35.0`, admin API OpenAPI read from the running instance) and `~/bars-engine` on 2026-11-22.
**Related:** `.specify/specs/wa-one-encounter/` (the already-specced single encounter) — this document generalises it to many worlds.

---

## 0. The frame in one paragraph

**WorkAdventure is the venue. bars-engine is the world.** WA owns movement, presence, video, and maps. bars-engine owns truth: who you are, what you may enter, what you planted, what happens when you touch something. Integration is exactly two seams — one WA already defines and expects (`ADMIN_API_URL`, the admin API), and one we define and keep small (a five-minute signed token in an iframe). Nothing in WA is forked. Every aesthetic decision flows from bars-engine's ARDS tokens so a second world costs a map, not an art project.

That inversion is the whole architecture. Everything below is consequences.

---

## 1. What is verified right now

| Fact | Value | Why it matters |
|---|---|---|
| Deployed WA | `v1.35.0`, 6 healthy containers | the contract below is *this* version's |
| `ADMIN_API_URL` / `ADMIN_URL` in `/opt/workadventure/.env` | **empty** | the door is unbuilt; nothing flows yet |
| Admin API OpenAPI | live at `/openapi/admin` on the box | 19 endpoints, listed in §3 |
| WA woka texture | **96×128** PNG (3 cols × 4 rows, 32px frames) | the avatar conversion target |
| ARDS walk sprite | **512×64** sheet | does **not** match; needs a repack pass |
| `map-storage` map format | `MapDetailsData.wamUrl` supported | maps can be `.wam`, not just Tiled JSON |
| Public gRPC `50051` | published by Traefik, **blocked by ufw** | bars-engine on Vercel cannot reach the Room API — see §7.3 |
| `TURN_SERVER` | empty | video fails behind symmetric NAT; there is a first-class fix, §7.4 |
| `/opt/wa-src` | `2.0.0-beta.9` checkout, tag `v1.35.0` present | source of truth for the deployed version is a `git checkout` away |
| `box-orchestrator-tick` service | POSTs to bars-engine `/api/work/tick` | the box→bars-engine worker pattern already exists and is the answer to §7.3 |

**Non-negotiable principle that falls out of the last three rows:** the box can talk *out* to bars-engine reliably; bars-engine cannot reliably talk *in*. Design every write path to be box-initiated or browser-initiated, never bars-engine-pushes-to-box.

---

## 2. Why not fork WorkAdventure

| | Fork | Extend (recommended) |
|---|---|---|
| Licence | AGPL + commons clause; kills the enterprise route | both routes stay open |
| Upgrade | every WA release is a merge conflict | pinned release; the swagger conformance test catches drift |
| Where game logic lives | split across two languages and two repos | one place: bars-engine |
| What you own | a hard fork forever | ~8 route handlers and one map script |

The single strongest argument: **WA 1.35 already has the API you would build.** The admin API exists precisely so an external system can own identity, entitlements, maps, and avatars. Forking to get what you were already given is pure cost.

---

## 3. Seam one — the admin API (the door)

WA calls *out* to us. Four routes matter; the rest are stubs returning WA's defaults.

| WA calls | bars-engine answers | Source of truth |
|---|---|---|
| `GET /api/capabilities` | `{"api/woka/list":"v1","api/save-textures":"v1","api/save-name":"v1","api/ice-servers":"v1", …}` | feature flags we opt into |
| `GET /api/room/access?userIdentifier=&playUri=` | `FetchMemberDataByUuidResponse` | `Player`, `Entitlement`, `Role` |
| `GET /api/map?playUri=&userId=` | `MapDetailsData` (`wamUrl` or `mapUrl`) | campaign ↔ world ↔ room |
| `GET /api/woka/list?roomUrl=&uuid=` | `WokaList` (collections → textures, 96×128 each) | ARDS walk register |
| `POST /api/save-textures` | persist the player's chosen layers | `Player.avatarConfig` |
| `GET /api/ice-servers` | TURN credentials (§7.4) | coturn shared secret |
| everything else | WA's default shape | — |

**`room/access` is where the game gets interesting.** The response carries fields that are effectively free features:

| Field | What we put there | Feature it buys |
|---|---|---|
| `username` | `Player` display name | you arrive as yourself |
| `userUuid` | `Player.id` | every later call is about you |
| `tags` | `gm` when role is `admin`/`gm`; `steward`, `nation:<key>` | WA shows GM tooling; map scripts branch on tags |
| `visitCardUrl` | `https://app…/garden` or a public profile URL | **the cheapest possible "my cultivation farm" link** — WA's player card opens it |
| `canEdit` | true only for `gm`/`admin` | in-room map editing for GMs, nobody else |
| `world` | `…/@/<org>/<worldSlug>` | rooms grouped into a world, "same world" navigation |
| `characterTextures` | the player's ARDS layers | their avatar is their character |
| `isCharacterTexturesValid` | false until they've chosen | forces avatar choice on first entry |
| `analyticsEventsEnabled` | false | no per-player telemetry |

`visitCardUrl` alone answers "at the very least linking people to their cultivation farm," and it needs no map work at all.

---

## 4. Seam two — the encounter (the play surface)

The `wa-one-encounter` spec got this right. Generalise it:

```
Tiled area          map script                     bars-engine                WA Room API
bars.mechanic  ──▶  WA.room.onEnterLayer    ──▶    /wa/surface/[mechanic]     (server → server)
bars.encounter      → GET /api/wa/token              │
                    → WA.nav.openCoWebSite(url)      │ writes nothing from browser
                    ← WA.event.on('bars:world-answer')│
```

Rules, in order of how much they protect you:

1. **A map declares mechanics; it never implements them.** An area carries `bars.mechanic` and `bars.encounter`. The script is one generic file for every world, not one per room.
2. **The surface holds only a token.** `signSurfaceToken({playerId, encounterId, mechanic, expires: 5m})` — HMAC, single purpose, no game state, no `playerId` in the URL.
3. **The server owns truth.** The iframe POSTs intent; bars-engine decides; bars-engine broadcasts. This is `depth_over_flatland` in practice.
4. **Private data never enters room state.** `WA.state` variables are shared with everyone in the room. Coin style, garden contents, emotional answers: server-side, rendered client-side per player. A room variable is for *public* facts ("the hearth is lit tonight").
5. **Walking away is a complete ending.** No partial writes, no lost state.

Mechanic registry (starts at one, grows by addition only):

| `bars.mechanic` | Surface | First use |
|---|---|---|
| `coin-turn` | `/wa/surface/hearth` | the hearth (spec'd) |
| `quest-node` | `/wa/surface/quest` | a CYOA node in a world |
| `tend-plot` | `/wa/surface/plot` | a garden mirror (§6, tier 2) |
| `npc-encounter` | `/wa/surface/npc` | an archetype agent in a room |

---

## 5. Layer A — assets: one token source, many surfaces

The mistake to avoid: drawing WA tilesets that look like bars-engine. They drift within a month. Instead, **every WA asset is generated from ARDS tokens by a script**, and the script is the thing you edit.

| ARDS register | WA surface | Conversion | New script |
|---|---|---|---|
| 1 Cosmic 1024² | room posters, `openWebsite` splash, zone banners | none — served as-is | — |
| 2 Provenance 24×24 | signage tiles, anchor markers | pad to tile grid | `export-tileset.ts` |
| 3 Portrait 64² layered | player context / visit card | `visitCardUrl` handles it | — |
| 4 **Walk sprite 512×64** | **woka collections** (96×128 per layer) | **repack grid + split layers** | `export-woka.ts` |
| 5 Frame/chrome 24×24 | action-bar icons, custom menu | upscale + WA icon sizing | `export-icons.ts` |
| 6 **Zone texture 64² tileable** | **Tiled tileset floors/walls** | tile-size decision (64 native or 32 downscale) | `export-tileset.ts` |
| 7 Ceremony | `WA.player.setOutlineColor`, layer tint | token → hex | inline |

The woka conversion is the only non-trivial one and it is ~60 lines of canvas work:

```
ARDS walk sheet 512×64   →  3 layers × 96×128
  base    (neutral body)      ┌───┬───┬───┐  row 0 = down
  nation  (element tint)      │ 0 │ 1 │ 2 │  row 1 = left
  archetype (silhouette)      ├───┼───┼───┤  row 2 = right
                              │ … │ … │ … │  row 3 = up
                              └───┴───┴───┘  32×32 frames
```

Layer order in WA's `WokaList` = paint order, so `base → nation → archetype` gives composited characters whose nation colour is *automatically* `ELEMENT_TOKENS[nation].frame`, forever, with no artist in the loop.

**Hosting:** serve from bars-engine `public/wa/` first. It is already the origin WA trusts (admin API), so one CORS policy and one cache rule. Move to `map-storage` only when non-developers need to upload without a deploy. Do not host assets on GitHub Pages — the starter map is there today and that is why `START_ROOM_URL` still points off-box.

---

## 6. The cultivation farm: link, mirror, tend

The Garden today (`/garden`, `getGarden()`) returns the player's planted BARs: `id, title, element, maturity, lensId, eaArc`. It is **private** — scoped by `creatorId` and `personalGardenId(player.id)`. That privacy is the design constraint, not a detail.

Three tiers, and they are additive, not alternatives:

### Tier 0 — Link (ships this week, no schema, no map)

- `visitCardUrl` → the player's garden (or a public profile that links to it). Appears in WA's player card for everyone who clicks you.
- One "kiosk" area in the hub: `openWebsite` → `…/garden` in an iframe. You walk to the kiosk, it opens *your* garden.

Cost: an iframe needs `openCoWebSite` with `allowApi`, and the garden page must tolerate being framed (check `X-Frame-Options`/CSP). Nothing else.

### Tier 1 — Mirror (the "Greenhouse" world)

Planted BARs become physical plots. The rule that makes it safe:

> **A plot exists in a room only if the viewer may see it.** `canViewBar(user, bar)` already exists as a concept in `ARCHITECTURE.md`. The projection endpoint filters per viewer, server-side. No shared room variable ever names a BAR.

```
GET /api/wa/greenhouse?w=<worldId>   →   { plots: [ { anchorId, tileX, tileY,
                                                    element, stage, label } ] }
```

- `stage` from `effectiveMaturity(...)`, `element` from `nation` — both already computed in `getGarden()`.
- Bars with `gardenId` set and `visibilityLevel ∈ {PUBLIC, NATION}` are eligible. Private stays private even in the mirror.
- The room is *read-only*: plots are displayed, not tended. Tending is tier 2 because it writes.

### Tier 2 — Tend (the actual practice loop)

An area on a plot opens `tend-plot`. Water / compost / harvest writes back through the surface token and resolves a **Grow Up** move. This is the tier that makes the farm feel like practice rather than a browser tab — and it is the one the prototype research (`INNER_GARDEN_IMPLEMENTATION_RESEARCH.md` §3) says bars-engine is missing.

Rule of thumb, worth writing into the spec:

| Intent | Tier | Why |
|---|---|---|
| "My farm, from anywhere" | 0 link | cheapest, zero risk |
| "Let people *see* the world is alive" | 1 mirror | collective view, private rows |
| "Allyship as practice, in space" | 2 tend | only tier that earns energy |

---

## 7. Game worlds running bars-engine code

You already have the world model. The work is projection, not invention.

**Superseded — see `docs/WA_MAP_PIPELINE.md`.** `SpatialMap` / `MapRoom` / `Anchor` are marked for deprecation and are
not needed. The generator already exists: `public/wa/heaven-sect/` turns a **design-language file** into a
WorkAdventure map. As of 2026-11-23 all three maps generate through a shared `public/wa/wa_export.py` that applies and
checks WorkAdventure's map rules, on branches `fix/wa-map-conformance-{lantern,dojo,sect}`.

```
sect-base.json  +  levels/<map>.json   ──▶  gen_sect.py  ──▶  <map>.tmj + tiles/ + render.png
(shared grammar)   (rooms, doors, seats,          (validates reachability, room minima, door widths)
                    walks, exits)
```

That is better than a DB→map generator, because the level file is diffable and reviewable, and it already emits real
WA semantics (`jitsiRoom`, `focusable`, `exitUrl` areas). Adding a `bars` block to a room in the level file is how a
room gains an encounter — no Tiled editing, no per-map script.

**Keep the graphs identical.** `transitions.ts` edges = WA room links (`WA.nav.goToRoom`). Narrative OS space ↔ room
1:1. If the two graphs disagree, players will find the seam within a minute.

### 7.3 The one real architectural problem: reaching the Room API

`bars-engine` is on Vercel. WorkAdventure's Room API is gRPC on `50051`, which ufw blocks and which Vercel's egress cannot reach anyway. So `broadcastWorldAnswer()` — the "world answers" half of the loop — has no route from bars-engine to the box.

Three candidate fixes, in order of preference:

1. **Box-side responder (recommended).** The box already runs `box-orchestrator-tick`, which POSTs *out* to bars-engine. Mirror that: a `box-wa-responder` service polls `GET /api/wa/outbox` (server-to-server token), takes queued world-answers, and calls the Room API over loopback with `ROOM_API_SECRET_KEY` already in `.env`. Box-initiated, no inbound hole, no Vercel egress dependency, and the existing tick pattern means no new operational concept.
2. **Self-host the responder next to WA** (`/opt/workadventure/` gets a small worker container on the `workadventure_default` network). Simpler, but couples it to the compose project.
3. **Expose 50051 with an allowlist.** Rejected: Vercel egress ranges are not stable, and it trades a firewall hole for a reliability bug.

**Consequence for the spec:** `room-api.ts` should be an *outbox writer*, not a gRPC client. That is a design change to `wa-one-encounter` T010, and it should be made before T010 is built.

### 7.4 The free fix that also solves video: `api/ice-servers`

The capabilities schema includes `api/ice-servers` — WA will ask us for TURN credentials. So:

- add `coturn` to the box (or a managed TURN),
- bars-engine answers `/api/ice-servers` with time-limited credentials,
- `TURN_SERVER` in `.env` stops being empty.

One integration, two problems solved: NAT'd video starts working *and* the credential authority lives in the system that knows who the player is. Do this early; it is the difference between a demo and a meeting space.

---

## 8. Build order

Each step is independently shippable and each one makes the next cheaper.

| # | Step | Depends on | Ships |
|---|---|---|---|
| 1 | **Asset export** — `export-tileset.ts`, `export-woka.ts`, `export-icons.ts` into `public/wa/` | nothing | assets that cannot drift |
| 2 | **Door, untrusted tier** — `capabilities`, `map`, `room/access`, `woka/list` answering **public data only** against a `WaDevice` uuid binding | 1 | people enter as their character |
| 3 | **OIDC** — discovery, authorize, token, jwks, userinfo; `sub = Player.id` | 2 | entitlements, `gm` tags, `canEdit`, private data unlocked |
| 4 | **Encounter registry + hearth** | 3 | the loop from `wa-one-encounter`, but generic |
| 5 | **Greenhouse mirror** (`kind: "garden"` room in the level language) | 4 | worlds, not rooms |

Step 2 deserves a warning: a device-uuid binding is *not* identity. Anything private — garden contents, entitlements, `canEdit` — must stay off until step 3. Write that in the route itself as a comment, because it is exactly the kind of shortcut that quietly becomes permanent.

---

## 9. Decisions for Wendell

1. **Identity: OIDC now, or device-binding first?** Recommendation: device-binding for public data only, OIDC immediately after — it unblocks visible progress in days without shipping a spoofable door. The `wa-one-encounter` spec says "stop and report if the only path is a full OpenID provider"; this is that report. OIDC is ~5 route handlers, not a project.
2. **Licence route.** Still open, still yours. Everything here works whether orgs self-host or you licence.
3. **Does the hub stay a hub?** The hub links to farms (tier 0). Worlds mirror them (tier 1). Confirm they are different rooms, not the same room with a mode — mixing them leaks private rows into a meeting space.
4. **Asset home:** bars-engine `public/wa/` (deploy-coupled, one origin) vs `map-storage` (upload without deploy). Recommendation: bars-engine now, map-storage when a non-developer needs it.
5. **`wa-one-encounter` T010 changes shape** from gRPC client to outbox + box-side responder (§7.3). Approve before that task is built.

---

## 10. What this does *not* claim

- No fork, no WA plugin, no custom WA image — if a requirement needs one, it comes back here as a decision.
- No shared room state for private data, ever.
- No hand-authored WA tile that does not trace to an ARDS token.
- No assumption that the box can be reached from Vercel. Outbound only.
