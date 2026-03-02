# Interview Summary: Stage Unlocks + Lore BARs

**Date:** Design session  
**Features:** (1) Stages unlock by % of goal; (2) Quest completions generate BARs for collective lore

---

## Feature 1: Stage Unlocks by % of Goal

| Question | Answer |
|----------|--------|
| **Override?** | Admin can override — advance early or hold back. % is the default trigger. |
| **Logic** | Stage 2 unlocks at ~15%, Stage 3 at ~30%, etc. (per THRESHOLDS.md). System suggests advancement; admin confirms or overrides. |

**Implied behavior:**
- Instance has `currentAmountCents`; compute % of `goalAmountCents`.
- When % crosses threshold for next stage, system marks "ready to advance" (or auto-advances if we want; admin override means admin still has final say).
- UI: Admin → Instances shows "Stage 2 ready (15% reached)" or similar. Admin clicks to advance.

---

## Feature 2: Quest Completions → Lore BARs

### Flow

1. **Player completes quest** → Vibeulons minted (existing).
2. **Player is prompted (choice):** "Add this to the collective lore?" — optional.
3. **If yes:** A BAR is created and goes to the player's **hand** (inventory).
4. **BAR content:** Structured template based on the quest's **move type** (Wake Up, Clean Up, Grow Up, Show Up).
5. **Player holds BAR** — no expiration. They contribute when ready.
6. **Contribute action:** From hand → click BAR → "Contribute to campaign lore" button. **Also from the wiki** — contribute a BAR while viewing campaign lore.
7. **Story surfaces:** Event page (timeline/feed), wiki/lore section, quest map — some combination.

### BAR Templates (by move)

| Move | Template prompt (example) |
|------|---------------------------|
| Wake Up | "What did I see?" |
| Clean Up | "What did I clear?" |
| Grow Up | "What skill did I develop?" |
| Show Up | "What did I complete?" |

*(Exact wording TBD; these are placeholders.)*

### Objects (implied)

- **LORE BAR** — CustomBar with `evidenceKind: 'lore'`. Has: creator, questId (provenance), moveType, template, player's response. Goes to hand first.
- **Library** — LORE BARs are added to the **library** (DocNode + DocEvidenceLink). "Something the player learned about the world."
- **Wiki** — Templated pages. Contributed lore is stored in the wiki's presentation layer, but content comes from the library (DocNodes). Wiki = templated slots; Library = content store.

### Governance

- Player owns the BAR until they contribute.
- Contribution = making it visible to the collective (event feed, wiki, map).
- Admin may need ability to moderate/hide inappropriate contributions (future).

---

## Game Loop Integration

| Step | Today | With Lore BARs |
|------|-------|----------------|
| 1. Wake Up | See quests in Market | Same |
| 2. Pick up | Accept quest | Same |
| 3. Show Up | Complete quest | Same |
| 4. Reward | Vibeulons minted | Same |
| 5. (New) | — | Optional: "Add to lore?" → BAR to hand |
| 6. (New) | — | Async: From hand → Contribute to lore (when ready) |

**Honors the loop:** Completion stays central. Lore is additive, optional, async. No blocking. BAR = kernel with provenance (quest, move, player).

---

## Open Questions (for spec)

1. **Schema:** Is a Lore BAR a CustomBar with a `loreStatus` or `questSource: 'lore'`? Or a new model (LoreContribution)?
2. **Contributed storage:** DocNode, custom table, or CustomBar in a "lore" visibility/collection?
3. **Event page feed:** Real-time? Paginated? How many items?
4. **Stage unlock UI:** Auto-advance with admin override, or always manual with "ready" indicator?

---

## Next Step

Draft spec additions for:
- Stage unlock by % (admin override)
- Lore BAR flow (choice → hand → contribute)
- BAR templates by move
- Story surfaces (event, wiki, map)
