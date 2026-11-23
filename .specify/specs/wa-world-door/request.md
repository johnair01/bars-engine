# Request: the door into the WorkAdventure world

<!-- The Ouroboros intake record for a new feature, written 2026-11-23. It is the `record` a battle names, so the
     build cannot drift from what was asked. Read it with the board card `wa-world-door-intake-1` (rows → questions)
     and the spec kit that follows it: spec.md, plan.md, tasks.md. Positions taken as read are listed in § 3; by
     Wendell's rule of 2026-11-11 they belong in six-faces-council `council/position-log.jsonl`, not on the board. -->

## The ask

> "ok how does one actually choose between those worlds? How does a player choose which world to show up in? Are the
> assets from this .tmj loaded into the client? And what do we need to have a character creation session inside of
> workadventure based on bars-engine?
>
> right now it's just a manual link I'd have to make and send people to but as as admin I'd like the ability to
> quickswap worlds and do a lot of this work inside of workadventure. The ability to see and walk through the council
> board while I'm inside the workspace"
>
> — Wendell, 2026-11-23, DeepAI Code thread `2026-11-23-ok-i-ve-been-setting`

Four things are asked for, and they are not four features: they are one door.

1. A player chooses a world instead of receiving a URL.
2. He swaps worlds himself, from inside the world, as admin.
3. Character creation happens in WorkAdventure, from bars-engine's own material.
4. The council board is visible — and walkable — from inside the workspace.

## 3: Face it (third person) — what stands today

Verified against the running box (`vps-498545bd`, WorkAdventure `v1.35.0`) and its source at `/opt/wa-src`, not from
memory.

**Three worlds exist and walk.** Lantern Walk (40×24), Calrunian Dojo (44×36), Heaven Sect court (96×80, eleven
labelled rooms, 14 areas). All three now pass WorkAdventure's validator and collide, and the court has been walked in
a real client: Gate Court spawn → avenue → Founder's Hall, 24 seats, Jitsi room opening on entry.

**A player lands on whatever URL they were handed.** `Room.createRoom(playUri)` asks `/map` for a `mapUrl` and loads
exactly that. `START_ROOM_URL` is still the public starter map
(`/_/global/workadventure.github.io/map-starter-kit/office.tmj`). There is **no world picker** in the open-source
client: `MapDetailsData.group` exists to label a world ("maps the notion of *world* in WorkAdventure SAAS") and nothing
in the client draws a list from it.

**The assets are the client's, every one.** Phaser loads the map JSON from `mapUrl`, then each tileset's `image`
**relative to that map URL**, and the map's `script` property the same way
(`GameScene.getScriptUrls` → `new URL(script, this.mapUrlFile)`). Observed in the walk-through's network log:
`lantern-walk.tmj` 200, `lantern-walk/tiles.png` 200, `Loading map related script at …/lantern-walk.js`. So the map
host is an asset host; there is no server-side map logic to hook, and a map can ship code.

**Character creation is one endpoint.** The customize screen is fed by `GET /woka/list?roomUrl=…`, which the pusher
proxies to `ADMIN_API_URL` `/api/woka/list` (`AdminWokaService`) and validates as `WokaList`: layers
(body/eyes/hair/clothes/hat/accessory), each with collections and textures. The choice is persisted per member through
`FetchMemberDataByUuidResponse.characterTextures`. `ADMIN_API_URL` is **empty**, so today the bundled pipoya woka is
what everyone gets. **There is no scripting API to set a woka's textures** (`Api/Iframe/player.ts` has no such
setter), so a bars-engine panel cannot dress a player — only WorkAdventure's own screen can, which makes `/woka/list`
the only door for (3).

**Editing in-client is enabled but WAM-only.** The box has `ENABLE_MAP_EDITOR=true` and
`MAP_EDITOR_ALLOW_ALL_USERS=true`, and `getCustomEntityCollectionUrl()` throws *"the map has no WAM file"*. Our
staged worlds are bare `.tmj`: the editor cannot touch them, and map-storage's world list (`MapListService`) only
lists `.wam`.

**The board is reachable from a session.** `POST /api/board/session-writes` with `COUNCIL_MENU_TOKEN` writes council
`rows` (born unrecorded, landed by board-pull). `positions` is no longer a board list (Wendell, 2026-11-11): positions
go to `council/position-log.jsonl` in six-faces-council.

### Positions taken as read

Each one is falsifiable, and each has an undo.

| # | Position | Evidence | Undo |
|---|---|---|---|
| P1 | A world is a map file; choosing a world is choosing a `mapUrl`. | `Room.createRoom` → `/map` → `mapUrl` | none needed; it is the platform |
| P2 | Multi-world is doors, not a directory. `exitUrl` and `WA.nav.goToRoom()` are the only two ways the client crosses between maps. | `GameScene.loadNextGameFromExitUrl`; `Api/Iframe/nav.ts` | a hub map can be dropped without touching the worlds |
| P3 | All world art is browser-side and public: the map server needs CORS and no auth. | network log, `getScriptUrls` | none; hiding maps would break `exitUrl` |
| P4 | A player's look can only be set through `/woka/list` + `/me`; no script can dress them. | `Api/Iframe/player.ts` has no texture setter | none until we fork, which we will not |
| P5 | Nothing private may reach the room: room state is shared with everyone in it. | `WA.state`; ARCHITECTURE.md `canViewBar` | none |

## 2: Talk to it (second person) — the fork the intake must settle first

**Who owns a world's map file.** Every one of the four asks changes shape under this, so it comes before them.

| | Where the world lives | What you gain | What it costs |
|---|---|---|---|
| **A** | bars-engine serves it (`/api/map` → `mapUrl`); the generator stays the only author; the world is read-only in-client | Determinism and the conformance gate hold; worlds ship with a deploy; no new hosting; the door is one route | You cannot redraw a room in the client; every change is a level file and a regenerate |
| **B** | Each world becomes a `.wam` in WA's map-storage; you draw in the client (editor already on) | You work inside WorkAdventure, which is half of what you asked for; rooms, areas and doors are yours live | The `.tmj` stops being reproducible: the generator becomes a seeder, and in-client edits are the truth |
| **C** | Split by kind: generated worlds (sect, dojo, lantern, hub) stay read-only; one **workroom** world is WAM and yours to draw in | Both, honestly: the sect stays sealed and you still get a place to build | Two owners to remember, recorded per map in `sect-base.json`; slightly more than either alone |

Held for the round after this one, because they cannot be answered well until the door's owner is known:

- **Who the player is.** Anonymous uuid (today) versus OIDC with `sub = Player.id`. This decides whether character
  creation, the garden and the board can follow a person between worlds — and it is the largest single piece of the
  door.
- **What ships first.** Hub + quickswap (a map and a script, days), the board panel (one area property, hours), or
  character creation (the `/woka/list` contract plus a 512×64 → 96×128 repack, weeks).
- **The board in-world, as panel or as ground.** An `openWebsite` area puts the board beside the player. A walkable
  board is a map generated from board rows, refreshed by regenerating — the client can change tiles, layers and
  properties at runtime but **cannot create areas**, so a live board cannot be walked into existence.

## 1: Be it (first person, tested)

Tested today, so the intake does not ask what the box would answer:

- The Heaven Sect court walked, in a real client, on the box: spawn in the Gate Court, avenue, Founder's Hall, the
  hall's Jitsi room opening on entry — with the bundled woka, because the stub admin API that broke it has been
  deleted.
- Two map rules that only a running client shows were found and fixed on the way (an `exitUrl` to a nonexistent map
  fails the whole room on open; a start tile inside an exit door teleports the player out on arrival), and both are now
  checks in `public/wa/wa_export.py`.
- The three worlds are staged and serve from the box's map-storage with CORS.

**The round closes when** the door's owner is answered on the board card `wa-world-door-intake-1`. Then the identity
question is asked, this record is extended with the answer, and spec.md is written against it.

## 4: The resolution list (owner, 2026-11-23)

Said plainly, in his words, and kept here so it is not re-derived:

1. **The dojo is the main map for the game.** Not the starter office, not a hub built for the purpose: Master
   Yun's dojo is where the game begins. It is already the editor-owned workroom (WAM + `/~` address, PR #972),
   so this is a `START_ROOM_URL` change plus the dojo's standing as the place everything buds from.
2. **A lobby where players choose which world to be part of.** World choice, in one room, before the world. In
   WorkAdventure's client that is a map whose doors are the worlds (`exitUrl` areas) plus a script for the ones
   that do not have a door yet — there is no world picker in the OSS client, so the lobby *is* a map.
3. **A working character creation flow.** Not a repack of two sheets: character creation belongs to user-ID
   integration and the larger bars-engine integration, so it waits on identity. The technical door is
   `/api/woka/list` (no script API can set a player's textures); the product door is "who is this player" —
   the same question that decides who may edit the dojo.

Sequence they imply: the dojo as home, then the lobby whose first door is the dojo, then identity, then
character creation on the back of identity. The asset contract (`docs/WA_ASSET_CONTRACT.md`, PR #972) is what
lets each new world in that lobby be made by someone else and still fit.

Still parked from the rounds before: who may edit the dojo (needs identity, so `MAP_EDITOR_ALLOW_ALL_USERS`
stays true until then, or friends get a read-only door); whether the office door is the friends' door; and the
portal list, so a friend's world is a row rather than a map edit.

## What the intake is not

It is not a plan to fork WorkAdventure (unchanged: extend only, WA runs unmodified at `v1.35.0`), and it is not a plan
to move the farm or the garden into room state. Both stand from `docs/WORKADVENTURE_INTEGRATION.md` and
`docs/WA_MAP_PIPELINE.md`.

## References

- `docs/WORKADVENTURE_INTEGRATION.md` — venue and world, the admin API as the door
- `docs/WA_MAP_PIPELINE.md` — the five map rules, the walk-through, and what is left
- `/opt/wa-src` @ `v1.35.0` — `play/src/front/Connection/Room.ts`, `Phaser/Game/GameScene.ts`,
  `Api/Iframe/nav.ts`, `Api/Iframe/player.ts`, `pusher/services/AdminWokaService.ts`,
  `libs/messages/src/JsonMessages/MapDetailsData.ts`, `map-storage/src/Services/MapListService.ts`
- Board mechanics — `src/app/api/board/session-writes/route.ts`, `src/lib/board/rows.ts`, `src/lib/board/session-write.ts`
