# Spec: Tap the Vein morning menu (TTV-MENU)

## Purpose

Wendell starts the day with a free write in Tap the Vein. The lines he keeps become a menu the six-faces council reads,
and every item on it is tied to a Lens goal, so the day's picks serve the year he set.

Source: the council's morning-menu pass (`wendell-britt/six-faces-council`,
`council/passes/6FACE_PASS_morning-menu1_2026-10-09.md`) and his board rulings of 2026-10-09:

- `mm-where`: the free write happens in Tap the Vein.
- `mm-raw`: only kept lines leave the free write.
- `mm-menu-shape`, in his words: "All items need a bridge to lens goals and game masters suggest ways to align to lens
  goals or suggest adding lens goals a smaller time scales to integrate (side quests merging into main quest)".

## Practice

Open → free write → brainstorm → commit → **menu** → work → seal. The menu step comes after commit so it is ready in
the morning, when the council's board read wants it. "Sealing the menu" is the HANDOFF's "at seal": it freezes the
copy the council reads. He can reopen the menu from the work step and seal again.

## Design decisions

| Decision | Why |
|---|---|
| Kept lines are today's live tasks plus brainstorm lines marked "play" that were never committed. Raw and composted lines stay in the session. | `mm-raw`. |
| At most seven items; tied first, suggested next, unaligned last. | `mm-menu-shape` position. Hiding an unaligned line is how drift goes unseen. |
| Suggestions are deterministic: word overlap with goal titles, then a small per-domain vocabulary. No model. | Dual-track rule and the community's allergy to AI (CLAUDE.md). The same morning always gives the same menu. |
| The Architect proposes an existing week or month goal the line serves. The Sage proposes a new goal one time scale down when the line fits a year or quarter goal's theme only. The Challenger asks him to place a line nothing claims. | The faces' own roles (`FACE_META`): blueprint, integration, edge. |
| A new side-quest goal hangs under the month goal in that branch closest to the line (as a week goal), else one step below the matched goal. | Keeps the year → quarter → month → week chain that the descent and lineage code rely on. |
| Tying a committed task updates the task's lens goal and snapshot and the quest it was born as. | The quest, the task and the menu tell the same story. |
| A suggestion he never accepted is exported as unaligned. | The bridge is his decision. |
| The export is built only from menu items; the session's `rawEntry` is never selected. | `mm-raw`, enforced in code and in the test. |

## Data and API contracts

- `TapTheVeinDailySession.morningMenu` (`morning_menu` JSONB, nullable):
  `{ lines: { [key]: { lensGoalId: string | null } }, sealedAt: string | null, sealed: MorningMenuExportItem[] | null }`.
  Keys are `line:<normalized text>` for kept lines and `task:<id>` for tasks he left unaligned. A task's bridge lives
  on the task row.
- Migration `20261009120000_add_ttv_morning_menu`; apply with `npx tsx scripts/apply-migration-ttv-morning-menu.ts`.
- Server actions (`src/actions/tap-the-vein-menu.ts`): `getMorningMenu`, `setMenuBridge`, `acceptMenuSuggestion`,
  `sealMorningMenu`.
- `GET /api/tap-the-vein/menu[?date=YYYY-MM-DD]` with `Authorization: Bearer <COUNCIL_MENU_TOKEN>` returns the latest
  sealed menu of `COUNCIL_MENU_PLAYER_ID`:
  `{ version: 1, sessionDate, sealedAt, items: [{ key, text, source, status: "bridged" | "unaligned", goal: { id, title, domain, cadence, chain, trace } | null }] }`.
  How the council session reaches it (network policy, the token) is the first step of the council's thread 3.

## Verification Quest

1. Free write, brainstorm, keep three lines, commit two of them.
2. Press "Make today's menu". Three items show. The uncommitted line shows a game master's suggestion.
3. Accept a Sage suggestion with an edited title. The Observatory shows the new goal under its parent, and the item
   reads "→ year → … → new goal".
4. Leave one line unaligned. It moves last and stays on the menu.
5. Seal the menu. `curl -H "Authorization: Bearer $COUNCIL_MENU_TOKEN" /api/tap-the-vein/menu` returns the three items
   and no text from the free write.

Automated: `npm run test:ttv-menu`.
