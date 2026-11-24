# Request: worlds that live on the box, and a bridge from the world into bars-engine

<!-- The Ouroboros intake record for a new feature, written 2026-11-23. It is the `record` a battle names, so the
     build cannot drift from what was asked. Read it with the board card `wa-world-kit-1` (rows → questions) and the
     spec kit that follows it: spec.md, plan.md, tasks.md. Positions taken as read are listed in § 3; by Wendell's
     rule of 2026-11-11 they belong in six-faces-council `council/position-log.jsonl`, not on the board. -->

## The ask

> "My friends worlds will live on my box. I'm creating the generator and tools to make it easy for them to extend MY
> world, and so I can extend MY world with URLs that can take information from the WA world into bars-engine"
>
> — Wendell, 2026-11-23, DeepAI Code thread `2026-11-23-ok-i-ve-been-setting`

Three sentences, three different promises, and they only look like one feature:

1. **One box.** A friend's world is a folder beside yours, not a server of theirs. Portals are paths, not links to
   strangers.
2. **A kit, not a favour.** Friends extend *your* world with tools you hand them — a generator, a language file, and
   the two checkers that decide whether what they made belongs.
3. **A bridge, out of the world.** A URL inside WorkAdventure can take what the world knows (who is standing where,
   what they touched) and put it in bars-engine.

The third sentence is the one with a hard constraint, and this intake exists to name it before anyone builds on a
trust assumption the box cannot support.

## 3: Face it (third person) — what stands today

Verified against the box (`vps-498545bd`, WorkAdventure `v1.35.0`) and its source at `/opt/wa-src`:

**Everything is one origin.** `PUBLIC_MAP_STORAGE_URL=https://world.masteringallyship.com/map-storage`, served out of
the Docker volume `workadventure_map-storage-data/_data`, with `app.use(cors())` and no auth on reads
(`map-storage/src/index.ts:88`). Worlds, tiles, map scripts and any JSON beside them are all readable by anyone who
has a world open.

**A world is a folder, a portal is a path.** Three worlds are staged there now (`lantern-walk/`,
`calrunian-dojo/`, `heaven-sect/`), each `<world>.tmj` plus its tiles. Cross-world travel is `exitUrl` (a room URL,
relative or absolute) or `WA.nav.goToRoom(url)` → `loadPage {url}` (`Api/Iframe/nav.ts:54`), and a room's `script`
property can register menu items at runtime (`WA.ui.registerMenuCommand`, `ui.ts:206`). Because every `exitUrl` is
fetched **when the room opens**, a dead door greys the room — a menu item does not, because nothing is fetched until
it is pressed.

**The checkers exist and bite.** `public/wa/wa_export.py` (five WorkAdventure rules) and `public/wa/check_assets.py`
(the art contract, `docs/WA_ASSET_CONTRACT.md`) both run inside the generators and both fail the build. On the box
today: the dojo and the lantern walk pass, a scratch dojo seed rebuilds byte-identical (`07f63d77`), the lantern walk
regenerates byte-identical (`82e7b844`), and four deliberate breakages fail with the file to open named.

**Nothing validates a write.** The editor's upload path is `UploadFileMapStorageCommand` → `fs.writeFile`. There is no
hook on it, so art can reach the live volume without passing either checker — which is exactly the gap a publish step
closes.

**Edit rights are server-wide, not per world.** `LocalAdmin.ts:98` decides `canEdit` from
`MAP_EDITOR_ALLOW_ALL_USERS || MAP_EDITOR_ALLOWED_USERS.includes(uuid) || tags admin/editor`. There is no per-map
check anywhere on that path. With `MAP_EDITOR_ALLOW_ALL_USERS=true` (the box's setting), **every visitor can edit
every `/~` world, including yours.** A friend cannot be given rights on their world and not on the dojo.

**Identity in the client is a suggestion.** `WA.player.uuid` is a random id in the browser's localStorage
(`Api/Iframe/player.ts:121`) — anyone can set it. The signed alternative, `WA.player.userRoomToken`, is
`undefined` on this box: `LocalAdmin.ts:248` returns `userRoomToken: undefined` because `ADMIN_API_URL` is empty.
`WA.player.isLogged` is false and `tags` empty without OIDC. So there is **no trustworthy identity** available to a
map script or a panel today.

**Entity prefabs are domain-wide.** map-storage's own comment: *"the custom entity collection is shared by every map of
the domain, so a deletion from one room removes the asset everywhere"* — and per-user ownership of a prefab is keyed by
that same spoofable uuid (`canUserEditCustomEntity`).

### Positions taken as read

Each is falsifiable and each has an undo.

| # | Position | Evidence | Undo |
|---|---|---|---|
| P1 | A friend's world is a folder on the box; a portal to it is a relative path, not a URL to their server. | same origin + volume: nothing to solve for CORS, dead links, or their downtime | a folder can be moved to their own host and become an absolute URL — the portal shape does not change |
| P2 | The volume is written only by a tool that validated what it is writing. | editor upload → `fs.writeFile`, no validator | drop the tool and hand-copy; the hole returns, nothing breaks |
| P3 | The WorkAdventure client is a **sensor, not an authority**. It may report "uuid x is at tile y"; it may not be believed about who x is, or about what x is owed. | `uuid` from localStorage; `userRoomToken: undefined` | if the admin API or OIDC ever lands, the same fields become claims — the endpoints keep their shape |
| P4 | Per-friend editing rights do not exist today, and cannot be invented without identity. | `LocalAdmin.ts:98`, no per-map gate | identity + tags/allow-list, or the publish route (P2) as a substitute |
| P5 | Entity prefabs are shared per domain, so editor-uploaded art crosses world boundaries. | `canUserEditCustomEntity` comment | keep art in the map's own folder, never in prefabs |
| P6 | Nothing private may reach room state. | `WA.state` is shared with everyone in the room | none |

## 2: Talk to it (second person) — the fork this intake must settle first

The hosting question is already answered by the ask above: **the worlds live on the box** (P1). What is not answered
is how much the bridge is allowed to *trust*, and everything else about the bridge changes under it.

| | What the bridge accepts | What you gain | What it costs |
|---|---|---|---|
| **A** | **Claims.** A script or panel posts `{uuid, room, tile, event}`; bars-engine logs it and re-decides everything server-side. | The bridge ships now, needs no admin API and no identity provider; presence, notices read, stances finished, garden visits all move; matches P3 instead of fighting it | A claim can be forged by anyone who can open the world; two browsers are two visitors; clearing storage makes a stranger |
| **B** | **Verified identity first.** Stand up OIDC, wait for `isLogged` and a `sub`, then build the bridge on it. | The bridge is trustworthy from its first line; character creation and per-friend edit rights unblock at the same moment | The bridge, the world kit's friend accounts and the lobby all wait on an identity provider; the useful part of this intake stalls |
| **C** | **Claims now, a signed door later** — ship A, then add the admin API's `userRoomToken` when a claim ever needs to be trusted. | Both, eventually | Two identity paths to keep; the trust upgrade lands late and looks like a rewrite to whoever reads the code cold |

Recommended: **A**. P3 is already the design rule — the client is a sensor — so accepting claims is not a compromise,
it is the shape the bridge would have anyway; B pretends a browser-origin script can be an authority, and C is A with
a promise attached. The upgrade path inside A is honest: the field that carries a spoofable uuid today carries a
verified `sub` the day identity lands, and no endpoint changes.

Held for the round after this one, because they are downstream of the answer:

- **Who may edit.** With `canEdit` server-wide (P4), "friends extend my world" also means "friends can redraw the
  dojo". Under A the honest options are: open editing with the publish gate as the real boundary; or friends submit a
  folder and *you* run `publish.py`; or identity lands first and the editor follows it. This is the sharpest
  consequence of A and it deserves its own card.
- **What the lobby reads.** `portals.json` generated from the volume (P1) versus hand-written versus a bars-engine
  endpoint. The door intake's lobby (§4.2 there) consumes this either way.
- **How much of the world the bridge reports.** Position every N seconds, or only events. Presence costs a request
  per player per tick; events cost nothing until something happens.

## 1: Be it (first person, tested)

- The art contract is enforced, and has been proven in both directions on the box (`asset contract: ok` for the dojo
  and the lantern walk; four deliberate breakages refused). PR #972.
- The dojo is an editor-owned WAM at `/_/global/world.masteringallyship.com/~/calrunian-dojo/calrunian-dojo.wam`, and
  the office door lands a player there in the editable form. Walked in a real client.
- The portal mechanism exists in miniature: `dojo.js` registers a Tools item that calls `WA.nav.goToRoom(…)`, verified
  in the client, and `registerMenuCommand` returns a handle that can be removed.
- The publish gate, the world kit and the bridge **do not exist yet**. That is what this intake is for.

**The round closes when** the trust fork is answered on board card `wa-world-kit-1`. Then the edit-rights card follows,
and `spec.md` is written against the answers.

## 5: Round one closed — answer A (2026-11-23)

> **A. Claims, keyed by browser uuid.** Saved on `wa-world-kit-1` at 2026-11-23T18:27:41Z; the board opened a claude-lane
> work item for it.

What A settles, and what it does not:

- **Settled:** the bridge accepts `{uuid, room, tile, event}` and bars-engine re-decides everything server-side. No
  admin API, no identity provider, no waiting. `WA.player.uuid` is the handle a visit and an event attach to.
- **Settled by implication:** P3 stops being a caution and becomes the contract — any code that trusts a report
  without re-reading its own state is a bug in bars-engine, not a hardening task.
- **Not settled:** B's cost was named honestly (forgeable claims, two browsers are two visitors, clearing storage makes
  a stranger) and A accepts it. What A does *not* answer is what a forged claim could be worth. That is a property of
  the events we choose to accept, so the spec gates every event behind "re-decided server-side" and records the
  upgrade path (a verified `sub` in the same field) without building it.
- **Carried forward:** the pop-up said `uuid` — so the bridge is anonymous by design, and character creation still
  waits on identity, as the door intake's §4.3 says.

The edit-rights card `wa-world-kit-2` went up with this answer, because A says nothing about who may *write* the world.

`spec.md`, `plan.md` and `tasks.md` in this folder are written against A.

## 6: Round two closed — answer C (2026-11-23)

> **C. Identity first, per-friend rights after.** Saved on `wa-world-kit-2` at 2026-11-23T18:31:46Z, against the
> intake's recommendation of B.

What C buys, and one thing it does not:

- **Buys:** trust. `WA.player.isLogged`, a verified `sub`, and — because `OPID_TAGS_CLAIM` exists in
  `EnvironmentVariable.ts:82` — tags that come from the identity provider rather than from a browser's localStorage.
  `LocalAdmin.ts:100` already grants `canEdit` on `tags.includes("admin" | "editor")`, so identities are the thing that
  makes that line mean something. It also unblocks character creation (the door intake's §4.3) and the friends' half of
  the kit.
- **Does not buy: per-world rights.** A tag is a property of a person, not of a map. A friend tagged `editor` can edit
  every `/~` world, exactly as `MAP_EDITOR_ALLOW_ALL_USERS` allowed. Per-world `canEdit` is decided by the admin API
  (`MapDetailsData.editable`), which is empty on this box and is the door intake's subject. So C gives *per-person*
  rights now and *per-world* rights only after the admin API is rebuilt — worth saying plainly, because "a friend can
  edit their wing and not the dojo" was the card's wording.

Consequences for this spec: Phases 1 and 2 are unchanged and unblocked (publish and the bridge need no identity).
Phase 3, the kit, moves behind identity, because a kit whose output nobody but the owner can publish is a folder of
instructions. Identity is now the critical path to three separate things and gets its own intake; this record stops at
naming it.

**Interim, until that intake lands:** `MAP_EDITOR_ALLOW_ALL_USERS=true` still means any visitor with a `/~` link can
redraw the dojo. C does not change that tonight. The stopgap that does not conflict with C is the same mechanism B would
have used, at one user: `MAP_EDITOR_ALLOW_ALL_USERS=false` with `MAP_EDITOR_ALLOWED_USERS` set to the owner's browser
uuid (`localStorage.localUser` → `uuid`). Nothing about it presumes identity; it is a lock, not a rights model.

---

## The seed, third pass (2026-11-23 late)

`seed.yaml` here is Ouroboros `auto_deeb4d33813f`, 14 interview rounds, **grade A**, ambiguity **0.3925**. Its
requester was the council: `ooo auto --requester-command council/tools/faces_requester.sh`, with every answer coming
back from the six faces on a free-tier model and checked before it stood. The earlier pass (single model, ambiguity
0.337) is superseded, not because it was foggier, but because this one's open questions are marked as questions.

Ledger: `~/sfc-check/council/ledger/faces.jsonl` holds each question and its verdict — `cited` where the record or
the repository answered it, `only_he_holds` where the answer is his. The seed's `assumptions` list names what was
never confirmed instead of quietly choosing.

---

## Ruled, 2026-11-23 evening

He answered the open questions in the thread. All six, plus every seed assumption, confirmed:

1. **Republish** - update in place; no new records; findings never duplicated.
2. **Token delivery** - environment variable; never in the kit folder.
3. **The success check** - findings stored with stable ids, CLI reporting new versus updated.
4. **Non-secret metadata** - travels with the kit.
5. **Token use** - the long-lived token in the Authorization header; no session exchange.
6. **The bridge** - a package inside the world-kit repo; the engine keeps only the findings route.

All five seed assumptions stand as written. The seed's `open_questions` list is now empty and its fog is 0.15, under
the 0.20 gate. Each ruling is in `council/ledger/rulings.jsonl` and binds later passes.
