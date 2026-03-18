# Deck, Card & Move Grammar — Implementation Plan

---

## Phase 1 — Grammar Resolver (no UI, no migrations)

Establish the composable grammar system as TypeScript constants + resolver. This phase produces no user-facing changes but makes the grammar available for Phase 2–3.

### Files to create

**`/src/lib/move-grammar/index.ts`** — types
- `FaceKey`, `FaceMoveType`, `MoveSlot`, `BaseFaceMove`, `NationFlavorProfile`

**`/src/lib/move-grammar/base-moves.ts`** — 12 `BaseFaceMove` constants
- Source material: `FACE_MOVE_TYPES` in `/src/lib/face-move-bar.ts` + face-move-sentences spec
- 6 faces × 2 move types = 12 template sentences with named slots

**`/src/lib/move-grammar/nation-profiles.ts`** — 5 `NationFlavorProfile` constants
- Argyra, Pyrakanth, Virelune, Meridia, Lamenth
- Each: `register`, `verbPalette[]`, `metaphorField`, `moveTypeInflections`

**`/src/lib/move-grammar/resolver.ts`** — `resolveMoveSentence()`
```ts
export function resolveMoveSentence(
  faceKey: FaceKey | null,
  moveTypeKey: FaceMoveType | null,
  nationKey: string | null,
  archetypeKey: string | null
): string
```
- Fetches `BaseFaceMove` → applies `NationFlavorProfile.moveTypeInflections` → applies `ArchetypeInfluenceProfile.prompt_modifiers` via `applyArchetypeOverlay()`
- All paths must degrade gracefully to base template when keys are null

**`/src/lib/deck-templates/index.ts`** — `DeckTemplate`, `CardSeedEntry` types + template registry
- `getAllTemplates(): DeckTemplate[]`
- `getTemplateByKey(key: string): DeckTemplate | undefined`

### Verify

- `npm run check` passes (type-only additions, no DB changes)

---

## Phase 2 — Schema Migration + Starter Decks

### Schema migration: `add_player_deck_and_cards`

Add to `prisma/schema.prisma`:
- `model PlayerDeck` (as in spec)
- `model PlayerCard` (as in spec)
- `CustomBar.promotedCardId String?` field
- `QuestProposal.proposalType String @default("quest")`
- `QuestProposal.cardEffect String?`

Run `npm run db:sync` after.

### Starter deck content files

```
/src/lib/deck-templates/starters/onboarding.ts      — ~8 cards, no grammar keys
/src/lib/deck-templates/starters/domain-gathering-resources.ts
/src/lib/deck-templates/starters/domain-direct-action.ts
/src/lib/deck-templates/starters/domain-raise-awareness.ts
/src/lib/deck-templates/starters/domain-skillful-organizing.ts
```

(Archetype starter decks are Phase 4 — they require more authored content)

### New action: `/src/actions/deck.ts`

```ts
export async function assemblePlayerDeck(
  playerId: string,
  instanceId?: string
): Promise<{ success: true; deckId: string } | { error: string }>

export async function drawCards(
  deckId: string,
  count: number
): Promise<{ success: true; cardIds: string[] } | { error: string }>

export async function playCard(
  cardId: string,
  questId?: string
): Promise<{ success: true } | { error: string }>
```

`assemblePlayerDeck()`:
1. Fetch player archetype/nation/domain
2. Select templates (archetype if present, domain if present, onboarding always as fallback)
3. Run `resolveMoveSentence()` on each `CardSeedEntry.bodyText`
4. Create `PlayerDeck` + `PlayerCard` rows
5. Shuffle, draw first 5 into hand

### Wire into campaign join

Edit `/src/app/invite/[token]/InviteSignupForm.tsx` or `/src/actions/invitations.ts`:
- After player creation + archetype/nation assignment: call `assemblePlayerDeck(player.id, instanceId)`

---

## Phase 3 — BAR→Card Promotion Pathway

### New component: `/src/components/bars/PromoteToCardButton.tsx`

Renders inside `BarDetailClient`. Visible when:
- `bar.status === 'active'`
- `bar.promotedCardId === null`
- Current player owns the bar

### New page: `/src/app/bars/[id]/promote/page.tsx`

Or modal off `BarDetailClient`. Form fields:
- `title` (text, pre-filled from bar.title)
- `bodyText` (textarea, pre-filled from bar.description)
- `moveType` (4-button selector, pre-filled from bar.moveType)
- `allyshipDomain` (4-button selector, pre-filled from bar.allyshipDomain)
- `playCost` (1–3 number input, default 1)
- `faceKey` (collapsed/optional — only for face-holding players)
- `archetypeKey` / `nationKey` (read-only display from player profile)

### New action: `promoteBarToCard()` in `/src/actions/deck.ts`

```ts
export async function promoteBarToCard(
  barId: string,
  overrides: {
    title?: string
    bodyText?: string
    faceKey?: string
    moveType?: string
    playCost?: number
    allyshipDomain?: string
  }
): Promise<{ success: true; cardId: string } | { error: string }>
```

Logic:
1. Validate ownership + `promotedCardId === null` + `status === 'active'`
2. Ensure player has `PlayerDeck` (create with onboarding template if missing)
3. Resolve body text: `resolveMoveSentence(faceKey, null, player.nationKey, player.archetypeKey)` + player's override body text
4. Create `PlayerCard`
5. Update `CustomBar.promotedCardId = card.id`
6. Add card to deck's `drawPileIds`
7. `revalidatePath('/hand')`, `revalidatePath('/bars/[id]')`

### Edit `/src/app/bars/[id]/BarDetailClient.tsx`

Add `<PromoteToCardButton barId={bar.id} promotedCardId={bar.promotedCardId} />` to the action area.

### Edit `/src/app/hand/page.tsx`

Add card hand display section:
- Fetch active `PlayerDeck` for player
- Show `handIds` as a card grid
- "Draw" button calls `drawCards()`

---

## Phase 4 — Archetype Starter Decks + Co-Design

### Archetype starter deck files (8)

```
/src/lib/deck-templates/starters/archetype-bold-heart.ts
/src/lib/deck-templates/starters/archetype-danger-walker.ts
/src/lib/deck-templates/starters/archetype-truth-seer.ts
/src/lib/deck-templates/starters/archetype-still-point.ts
/src/lib/deck-templates/starters/archetype-subtle-influence.ts
/src/lib/deck-templates/starters/archetype-devoted-guardian.ts
/src/lib/deck-templates/starters/archetype-decisive-storm.ts
/src/lib/deck-templates/starters/archetype-joyful-connector.ts
```

Each: ~8 cards that express the archetype's grammar through all 4 move types.

### Wire archetype templates into `assemblePlayerDeck()`

When player has `archetypeId`, add the matching archetype template to the seed pool alongside the domain template.

### Extend co-design pathway

Edit `prisma/schema.prisma`: add `QuestProposal.proposalType` + `cardEffect` fields (migration: `add_quest_proposal_card_type`)

Edit `/src/app/admin/quests/[id]/page.tsx` or admin review flow: when `proposalType='card'`, approval calls `promoteBarToCard()` and puts the result into a shared community template pool.

Extend `assemblePlayerDeck()`: after static templates, query approved card proposals matching archetype/domain and add to seed pool.

---

## Acceptance Criteria

### Phase 1
- `resolveMoveSentence('challenger', 'issue_challenge', 'pyrakanth', 'bold-heart')` returns a different string than `resolveMoveSentence('challenger', 'issue_challenge', 'meridia', 'danger-walker')`
- `resolveMoveSentence(null, null, null, null)` returns a non-empty fallback string
- `npm run check` passes

### Phase 2
- `assemblePlayerDeck()` creates a `PlayerDeck` + `PlayerCard` rows for a player with archetype + domain
- Onboarding template used as fallback for players with no archetype
- Campaign join flow triggers deck assembly
- `npm run build` + `npm run check` pass after migration

### Phase 3
- BAR with `status='active'` and no `promotedCardId` shows "Promote to Card" button
- Promotion creates a `PlayerCard` and sets `CustomBar.promotedCardId`
- Second promotion attempt on same BAR is blocked (idempotency)
- Promoted card appears in player's hand on `/hand`
- `npm run build` + `npm run check` pass

### Phase 4
- `assemblePlayerDeck()` for a Danger Walker player produces a deck with both domain cards and archetype-specific Danger Walker cards
- Community-approved cards appear in deck assembly for matching players
- `npm run build` + `npm run check` pass
