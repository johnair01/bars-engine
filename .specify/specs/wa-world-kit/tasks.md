# Tasks: the world kit and the bridge

Ordered, each with the thing that proves it done. `spec.md` is the contract; `plan.md` is why this order.

## Phase 1 — publish and the list

- [ ] **T1. `public/wa/publish.py` refuses a bad world.**
      Reads `<dir>` → map + `world.json`; runs `wa_export.check`, `check_exits`, `check_assets.run_all`; exits 1 and names
      the file on any error, copying nothing.
      *Done when*: a folder with a 512×64 woka is refused with the woka's path; the dojo with no `world.json` is refused
      naming `world.json`.

- [ ] **T2. Publish copies, and only after a snapshot.**
      `--volume` default `/var/lib/docker/volumes/workadventure_map-storage-data/_data`; tar snapshot per handle into
      `snapshots/`; `cp -a` into `_data/<handle>/<world>/`; `chown 1000:1000`; strips `._*` and `gen_*.py`.
      *Done when*: a second publish of identical input changes no served bytes, and one snapshot exists per publish.

- [ ] **T3. `portals.json` is generated, and idempotent.**
      Scans `_data/*/*/world.json`, sorts by `order` then title, writes `{generatedAt, worlds[]}` next to the lobby map,
      prints appeared/vanished.
      *Done when*: two runs over unchanged input produce identical bytes apart from nothing (the timestamp is the only
      variable and is checked to be stable across a dry run), and removing a world removes its entry.

- [ ] **T4. `world.json` for the three staged worlds.**
      Title, author, licence, entry, door (dojo: from the lantern walk's office door; lantern: from the dojo's menu),
      order.
      *Done when*: `publish.py --dry` accepts all three.

## Phase 2 — the bridge

- [ ] **T5. The event registry is the contract.** `src/lib/wa/bridge.ts` with `notice.read`, `stance.finished`,
      `plot.tended`, `bench.sat`, each with its allowed `meta` keys.
      *Done when*: an unknown event name is refused by a unit test, and a known one with an unknown meta key is either
      stripped or refused (decision recorded in the file).

- [ ] **T6. `POST /api/wa/event`.** CORS allow-list from env, 30/min per uuid+room, append to `wa-events.jsonl`, returns
      `{ok, accepted, reason?}`.
      *Done when*: `curl` shows 200 accepted, 200 refused (unregistered event), 400 malformed, 429 after the bucket empties,
      and a cross-origin preflight from a non-world origin fails.

- [ ] **T7. `POST /api/wa/presence`.** In-memory, 60 s TTL, returns `{ok, players}`.
      *Done when*: two uuids post, both counted; one stops posting, and is gone after the TTL sweep.

- [ ] **T8. `public/wa/bridge.js`.** `bridge({origin, room})` → `{event, presence}`; presence every 10 s; `keepalive`;
      swallows every failure; one flag disables it.
      *Done when*: with the origin pointed at a closed port, the room loads and walks, the console has no unhandled
      rejection, and `wa.event()` resolves `{ok:false}`.

- [ ] **T9. One real event end to end.** The Lantern Walk's notice read posts `notice.read {step}`.
      *Done when*: reading notice 2 in a browser appends one line to the log on the box, and the line carries uuid, room,
      tile and event and nothing else.

## Phase 3 — the kit (gated on `wa-world-kit-2`)

- [ ] **T10. `public/wa/world-kit/`** with `README.md`, `language.json`, `gen_world.py`, `check_assets.py`,
      `wa_export.py`, `world.json`, `example/`.
      *Done when*: from an empty directory on the box, following only the README produces a world that
      `check_assets.py` passes and `publish.py --dry` accepts.

- [ ] **T11. `gen_world.py` is a generalisation, not a copy-paste.** Door/corridor/NPC rules read from the language;
      palette named; no dojo-specific branch left in the layout code.
      *Done when*: changing one palette entry in `language.json` changes the output, and nothing else does.

## Phase 4 — the lobby reads the list

- [ ] **T12. One "Portals" Tools item** opening a panel that fetches `portals.json` and lists worlds.
      *Done when*: a second published world appears after a refresh; a deleted `portals.json` leaves the room walkable.

## Cross-cutting

- [ ] **T13. No secrets audit.** `grep -rEi "token|secret|password" public/wa` returns nothing that is served to a
      browser.
      *Done when*: clean, and noted in `docs/WA_ASSET_CONTRACT.md` §8 (friends' worlds).

- [ ] **T14. Record the answer to `wa-world-kit-2`** in `request.md` §5 and adjust T10/T11 if friends publish from their
      own side.

## Out of scope, named so it is not assumed

Admin API, OIDC, Prisma models, per-world edit rights, watchers. Each is a later card or a later spec.
