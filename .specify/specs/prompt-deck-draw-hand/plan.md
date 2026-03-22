# Plan: Prompt deck draw + shared hand

**Spec:** [spec.md](./spec.md)  
**Implements after:** spec kit tasks order.

## Summary

Add **draw / hand / discard** state with a **single 5-slot hand** across **multiple** prompt decks (Scene Atlas archetype deck, nation decks, future). **Player picks deck → draw** (random undealt for that deck’s **play cycle**). **Quest play** → **per-deck discard** only in **play-cycle** state; **empty draw** → **reshuffle discard** for that deck. **Discard never removes or alters `BarBinding` / grid.** **Rank 1–12** maps to move family + level; **13** = wild (move chosen at play). **Grid-bound** BARs excluded from hand cap and compost.

## Phases

### Phase 1 — Contracts (no UI)

1. **`rankToPromptMove.ts`** (or under `creator-scene-grid-deck/`) — `rank → { family: wakeUp \| cleanUp \| growUp \| showUp \| wild, level: 1 \| 2 \| 3 \| null }`.
2. **State model doc** — choose `ActorDeckState` extend vs new table; fields: `deckId`, `playerId`, `drawOrder` / piles, **`handCardIds` (max 5 global)** — clarify how multiple decks share one hand in one row vs `Player` JSON.
3. **Server actions:** `drawPromptCard(deckId)`, `recordQuestMovePlay({ barId, deckId, wildMoveFamily? })`, `reshuffleIfEmpty(deckId)` (internal).

### Phase 2 — Scene Atlas + nation decks

4. **Nation deck** seed or template pattern (parallel to `seed-creator-scene-deck`); prompt resolution from nation + rank/suit.
5. **Archetype prompt overlay** — extend `load-deck-view` or parallel loader for “effective prompt text” per player archetype.

### Phase 3 — UI

6. **Deck picker + Draw** on **`/creator-scene-deck` and `/hand`** (both); eligibility = member instances with `BarDeck`; labels = instance name + Nation vs Scene Atlas (see [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) IA).
7. **Hand strip** (5 slots) — show which deck each card came from; tap → complete flow / bind.
8. **Quest hook** — when move used, update **play-cycle** discard (+ wild metadata); **do not** touch `BarBinding`.

### Phase 4 — Verification

9. Tests: rank mapping; hand cap with two mock decks; discard + reshuffle simulation.
10. Manual: two decks, draw alternately, hand never exceeds 5.

## Open questions (resolve in tasks)

- **Single DB row for hand:** one `ActorDeckState` per player with `instanceId` null and `handCardIds` mixing card ids from multiple `deckId`s — requires **globally unique** `BarDeckCard.id` (already true) and **deckId** on each card via relation.
- **Resolved — binding vs discard:** **Discard does not remove a card from the grid.** `BarBinding` is **never** archived/deleted by quest discard. **Play/use** and **grid placement** are **orthogonal**; implement separate state (see spec § Orthogonal layers).

- **Still open — cycle membership vs bound cells:** Can the same `BarDeckCard` id appear in **play-cycle** piles while also **bound** on the grid, or are cycles **logical copies**? Pick in Phase 2 schema task; invariant is **binding mutations ≠ discard mutations**.

## File impacts (anticipated)

| Area | Files |
|------|--------|
| Lib | `src/lib/prompt-deck/` or `creator-scene-grid-deck/rank-move-map.ts` |
| Actions | `src/actions/prompt-deck.ts` (new) |
| Schema | `prisma/schema.prisma` — extend `ActorDeckState` or add model |
| UI | `SceneDeckClient`, `hand` page, quest completion path |
