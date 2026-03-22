# Tasks: Prompt deck draw + shared hand

## Phase 0: Spec kit

- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md`
- [x] Cross-link from `creator-scene-grid-deck/spec.md` (Related specs)

## Phase 1: Rank mapping + types

- [x] `rank → move family + level` helper; **13 → wild** — `src/lib/prompt-deck/rank-move-map.ts`
- [x] Unit tests — `npm run test:prompt-deck`

## Phase 2: Persistence

- [x] **`PlayerPromptHand`** (global hand JSON, max 5) + **`PromptDeckCycle`** (draw/discard per player × `deckId`). Migration `20260321100000_prompt_deck_play_hand_and_cycle`.
- [ ] Apply DB migration locally/prod: `npx prisma migrate deploy` or `npm run db:sync`

## Phase 3: Server actions

- [x] `drawPromptCard(deckId, instanceSlug)` — random undealt; hand cap; slug-scoped deck
- [x] `discardPromptCardForQuest(cardId, instanceSlug, wildFamily?)` — play-cycle only; **no** `BarBinding` changes
- [x] Reshuffle when draw empty — `ensureCycleReady`

## Phase 4: Prompts (archetype + nation)

- [ ] Archetype-resolved prompt text overlay
- [ ] Nation deck seed / second deck + **deck selector** in UI (**Scene Atlas** + **`/hand`**: query member instances with `BarDeck`; label **instance name** + **Nation | Scene Atlas**)

## Phase 5: UI

- [x] Draw + hand strip on Scene Atlas (`PromptDeckPlayBar`)
- [ ] **Parity:** same deck picker + draw/hand strip on **`/hand`** as on Scene Atlas (shared components / loaders)
- [ ] Auto-remove from hand on successful bind from drawn card (optional UX)
- [ ] Quest completion → call `discardPromptCardForQuest` (replace stub link)
- [ ] Wild pick UI at discard/play for rank 13

## Phase 6: Rules + polish

- [ ] Invariant test: discard does not touch bindings
- [ ] Wiki `/wiki/grid-deck` — draw, hand, discard, wild

## Verification

- [x] `npm run test:prompt-deck`
- [ ] `npm run check`
- [ ] Manual: two decks, shared hand cap, full reshuffle cycle
