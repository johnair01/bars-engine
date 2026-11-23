# Spec: A solo worked charge feeds the Between

Status: draft, for review. Source: Wendell's answer A on `ma-gf-charge-feeds-between` (council board row `waker-faces-hhhqwm6r`:
"Write the feed spec and its untraceability tests as a draft PR"), from the six-faces-council pass
`council/passes/6FACE_PASS_mastering-alchemy-game-frame-1_2026-11-17.md`. Spec and tests only. No code is changed by this file.

## The ask, as the pass states it

A charge worked alone at the hearth feeds the Between the way tea and pots do: "as a feed with no trace of the basin, so the
friend sees the Between grow and never learns which spring, which floor or how often." The charge carries no channel, floor,
word or count of how often.

## 1. The existing tea feed, as read

Read at `88e04da` (main, 2026-11-21).

- The call: `teaPour()` in `public/between/garden.js:1456-1465`. After it attaches and pours the cup it calls
  `window.__between.growthView.poured()` (`garden.js:1464`).
- The implementation: `poured()` in `public/between/growth-view.js:138-150`. It returns early in a home garden or a garden with
  fewer than two members (`growth-view.js:139-140`). It picks the pot's tea (`pick`, `growth-view.js:129-132`), then writes one
  item: `{ kind: "cup", by: me, at, tea, status }` to the path `items/cup-<at in base 36>` through `B.op(...)`
  (`growth-view.js:146-148`). `status` is `"drunk"` with `drunkBy` and `drunkAt` when the other friend is in the Between at that
  moment, and `"poured"` (a covered cup) when they are not.
- The write path: `op()` in `garden.js:228-238`, which sends `{ path, op, data }` to the garden's shared store, or queues it in
  the outbox when offline.
- The growth record: there is no separate growth table. The Between's growth is derived on every read from the shared `items`
  by `read()` in `public/between/growth.js` (feeds at `growth.js:100`, `growth = feeds.length` at `growth.js:101`, health at
  `growth.js:121-124`). What counts as a feed is decided in one place, `isFeed()` (`growth.js:27-53`). A cup counts only when
  `item.kind === "cup" && item.status === "drunk" && item.drunkBy && isNum(item.drunkAt)` (`growth.js:45`), which yields
  `{ kind: "cup", by: [item.by, item.drunkBy], at: item.drunkAt }`. `garden.js:297-318` (`growthOf`) feeds `read()` the items
  both friends already share, so both compute the same light.

## 2. The charge feed

The charge feed is the same call: `growthView.poured()`, or a sibling that writes the same `{ kind: "cup", by, at, tea, status }`
item through the same `B.op("items/cup-<at>", "set", ...)` and is read by the same `isFeed()` case. The payload holds exactly
the fields a tea cup holds and nothing else.

The payload holds no basin data. It never contains: a spring or channel name, a floor or step, a pool word or any of the
person's answer text, a charge or ember id, a move, an element, a duration or a length, or a counter. The `tea` field is chosen
by `pick()` from the Between's own pot state (`growth-view.js:129-132`), never from the charge. The basin code decides when to
call it; what it decides on stays on the basin's side of the call and is not passed in.

## 3. Tests

The pass numbers the tests T-GF1 to T-GF4 (pass lines 371-375). The ticket text swapped T-GF2 and T-GF3; this spec keeps the
pass's numbering and names each test by what it asserts, so nothing is lost either way.

**T-GF2: depth and length buy nothing.** A headless run works the same charge at the same move twice, once with a one-word
answer and once with a long answer. Observable: the two runs write items with the same keys and the same values except `at`,
and `read()` returns the same `growth`, `health`, `potsFound` and `bowls` after each. (The pass's wording: "the same floor for
a one-word answer and a long one at the same move".)

**T-GF3: repeating buys nothing more.** A headless run works the same act at the same spring a second time. Observable: after
the second run the number of feed items `isFeed()` returns, and `read().growth`, equal their values after the first run.
Open question 2 says where the repeat gate lives, because tea does not gate repeats today.

**T-GF4: a friend's view cannot tell what produced the growth.** Run three histories that end in one fed Between: a charge at
the low spring, a charge at the crown, and three charges across springs and floors (each collapsed per T-GF3). Observable, on
the other friend's side: the serialised shared `items` (a deep diff after normalising `at` and ids), the output of
`read()`, and `window.__between.growth()` are identical across the three histories, and a search of the shared store for the
basin's pool words, spring names and floor words (the stop list the basin test already holds) finds nothing. The friend's HUD
text, bowls, and toast text are identical too.

T-GF1 (a person who was not told does one hearth sit and names what changed with no number, level or lock) is a look test at
the spec's first look and is outside this spec's build.

## 4. What `content/ontology-game/cave/basin-test.mjs` would gain

It checks the basin only: the page's words hold to the stop list (B3), the floor sets its run, the crown answers once, the
mouth walks back to the room, and a Fear sitting raises the brow (header, lines 4-6). It never loads the Between. It would
gain a section that, after a worked charge, captures every outgoing store write and asserts: (a) exactly one item write, of
kind `cup`, with only the tea cup's keys; (b) the serialised write contains none of the stop-list words, spring names or
floor words (T-GF4's search, run on the write itself); (c) the write is byte-identical, after normalising `at` and id, for a
one-word and a long answer (T-GF2); and (d) a second act at the same spring writes nothing (T-GF3). The cross-histories
equality in T-GF4 needs both pages, so it probably belongs in a new Between-side test beside it. That choice is for the build.

## Open questions

1. **A solo cup is covered, not a feed.** A tea cup feeds only when the other friend drinks it (`growth.js:45`); poured alone it
   waits as `"poured"` (`growth-view.js:6-7, 146`). A charge is worked alone. Does a worked charge feed at once (a new
   `isFeed` case or an item written already `"drunk"` with no `drunkBy`), or does it leave a covered cup the friend completes?
   The first changes `growth.js:45`'s rule; the second leaves the friend knowing a cup came from somewhere. This is a question
   for the board.
2. **Where the repeat gate lives.** Today each tea cup is one more feed (`growth.js:100-101`), so repeats buy more. T-GF3
   needs a gate, but a gate keyed on the spring would be basin data. The spec proposes that the basin side keeps its own "fed"
   mark (never sent) and writes the item once per act-at-a-spring. Whether that mark may live in the basin's own store is
   unread.
3. **Pot choice.** `pick()` counts the player's own cups (`growth-view.js:129-132`). A charge cup would advance which tea the
   next pour makes. Does a charge count as a cup for that rotation?
4. **Offline.** `op()` queues writes in the outbox (`garden.js:230`), so a charge written offline reaches the friend later, in
   a burst. Whether that burst leaks "how often" is untested.
